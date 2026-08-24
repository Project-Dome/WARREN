/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @description Use case: copia as previsões de parcela
 * (customrecord_wr_installment_prevision) do PO de origem de uma Vendor Bill
 * recém-criada, gerando uma cópia própria por fatura — Docs/TECH-SPEC.md, seção 1.1.
 *
 * Regras aplicadas aqui:
 * - Só copia se a transação de origem (createdfrom) for de fato uma Purchase Order.
 * - Se não houver previsões vinculadas ao PO, não faz nada.
 * - Cópia por linha, best-effort: falha em uma previsão é logada e não interrompe
 *   as demais (Docs/TECH-SPEC.md, "Tratamento de erro").
 * - Sem deduplicação entre faturamentos parciais do mesmo PO — comportamento intencional.
 * - O registro original (vinculado ao PO) nunca é alterado — apenas lido.
 */
define([
    'N/log',
    '../../NetsuiteTools/pd_cnt_standard/pd-cnts-search.util',
    '../Models/InstallmentPrevision.model',
], function (log, search_util, InstallmentPrevisionModel) {

    const PURCHASE_ORDER_TYPE = 'purchaseorder';

    /**
     * @param {Object} params
     * @param {string|number} params.purchaseOrderId id lido do campo nativo createdfrom
     * @param {string|number} params.vendorBillId id da Vendor Bill recém-criada
     */
    function execute(params) {
        const purchaseOrderId = params.purchaseOrderId;
        const vendorBillId = params.vendorBillId;

        if (!isPurchaseOrder(purchaseOrderId)) {
            return;
        }

        const sourceRows = InstallmentPrevisionModel.getByTransactionId(purchaseOrderId);

        if (isNullOrEmpty(sourceRows)) {
            return;
        }

        let copiedCount = 0;
        sourceRows.forEach(function (sourceRow) {
            if (copyRow(sourceRow, vendorBillId)) copiedCount++;
        });

        log.audit({
            title: 'CopyInstallmentPrevisions | execute - success',
            details: JSON.stringify({
                purchaseOrderId: purchaseOrderId,
                vendorBillId: vendorBillId,
                found: sourceRows.length,
                copied: copiedCount,
            }),
        });
    }

    /**
     * @returns {boolean} true se a cópia foi criada com sucesso
     */
    function copyRow(sourceRow, vendorBillId) {
        try {
            InstallmentPrevisionModel.createCopy(sourceRow, vendorBillId);
            return true;
        } catch (e) {
            log.error({
                title: 'CopyInstallmentPrevisions | copyRow - falha ao copiar previsão de parcela',
                details: JSON.stringify({
                    sourceInstallmentPrevisionId: sourceRow.internalId,
                    vendorBillId: vendorBillId,
                    error: (e && e.message) || e,
                }),
            });
            return false;
        }
    }

    /**
     * Confirma que a transação de origem (createdfrom) é de fato uma Purchase Order,
     * não outro tipo de transação nativa.
     * @param {string|number} transactionId
     * @returns {boolean}
     */
    function isPurchaseOrder(transactionId) {
        if (isNullOrEmpty(transactionId)) return false;

        const purchaseOrder = search_util.first({
            type: PURCHASE_ORDER_TYPE,
            columns: { internalId: { name: 'internalid' } },
            query: search_util.where(search_util.query({ name: 'internalid' }, 'anyof', transactionId)),
        });

        return !isNullOrEmpty(purchaseOrder);
    }

    return { execute: execute };
});