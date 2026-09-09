/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @description Use case: copia as previsões de parcela
 * (customrecord_wr_installment_prevision) da(s) PO(s) de origem de uma Vendor Bill
 * recém-criada, gerando uma cópia própria por fatura — Docs/TECH-SPEC.md, seção 1.1.
 *
 * Regras aplicadas aqui:
 * - Uma Vendor Bill pode ter mais de uma PO de origem; cada uma é processada
 *   individualmente e o resultado final é a união das previsões de todas as POs.
 * - Só copia previsões de transações que sejam de fato uma Purchase Order (blinda o
 *   fallback via createdfrom, que pode não apontar para uma PO).
 * - Se não houver previsões vinculadas a nenhuma PO, não faz nada.
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
     * @param {Array<string|number>} params.purchaseOrderIds ids identificados no sublist
     * purchaseorders da Vendor Bill (ou createdfrom como fallback)
     * @param {string|number} params.vendorBillId id da Vendor Bill recém-criada
     */
    function execute(params) {
        const purchaseOrderIds = params.purchaseOrderIds;
        const vendorBillId = params.vendorBillId;

        const sourceRows = purchaseOrderIds
            .filter(isPurchaseOrder)
            .reduce(function (rows, purchaseOrderId) {
                return rows.concat(InstallmentPrevisionModel.getByTransactionId(purchaseOrderId));
            }, []);

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
                purchaseOrderIds: purchaseOrderIds,
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
     * Confirma que a transação de origem identificada (sublist purchaseorders ou o
     * fallback createdfrom) é de fato uma Purchase Order, não outro tipo de transação
     * nativa.
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