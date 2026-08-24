/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @author ProjectDome
 * @description Vendor Bill (afterSubmit, CREATE) — copia as previsões de parcela
 * (customrecord_wr_installment_prevision) do PO de origem (campo nativo createdfrom)
 * para a Vendor Bill recém-criada. Docs/TECH-SPEC.md, seção 1.1.
 *
 * Script ID / deployment: ver Docs/MANIFEST.md — customscript_pd_ipc_vendor_bill_ue é
 * inferido do nome do arquivo (fase de design, ainda sem deploy). Confirmar/gerar o ID
 * real no ambiente NetSuite ao criar o registro de script.
 */
define([
    'N/log',
    '../UseCases/CopyInstallmentPrevisions',
], function (log, CopyInstallmentPrevisions) {

    // TEMPORARIO / DEBUG — remover antes de considerar este script pronto para produção.
    // Motivo: no ambiente real, a Vendor Bill não está vindo com `createdfrom` preenchido;
    // a ligação com o PO parece vir do sublist nativo `purchaseorders` e/ou da coluna
    // `orderdoc` do sublist `item`. Isso contraria o TECH-SPEC.md (seção 1.1), que assume
    // `createdfrom` como identificação única do PO e marca o sublist `purchaseorders`
    // como fora de escopo — precisa ser revisado com o usuário antes de virar definitivo.
    const TEMP_ENABLE_EDIT_FOR_TESTING = true;

    function afterSubmit(context) {
        const isCreate = context.type === context.UserEventType.CREATE;
        const isEditForTesting = TEMP_ENABLE_EDIT_FOR_TESTING && context.type === context.UserEventType.EDIT;

        if (!isCreate && !isEditForTesting) return;

        const vendorBill = context.newRecord;

        logPurchaseOrderSublistsForDebug(vendorBill); // TEMPORARIO / DEBUG

        const purchaseOrderId = vendorBill.getValue({ fieldId: 'createdfrom' });

        if (isNullOrEmpty(purchaseOrderId)) return;

        CopyInstallmentPrevisions.execute({
            purchaseOrderId: purchaseOrderId,
            vendorBillId: vendorBill.id,
        });
    }

    // TEMPORARIO / DEBUG — loga o sublist `purchaseorders` e a coluna `orderdoc` do
    // sublist `item` para descobrir como identificar o(s) PO(s) de origem quando
    // `createdfrom` está vazio. Remover junto com TEMP_ENABLE_EDIT_FOR_TESTING.
    function logPurchaseOrderSublistsForDebug(vendorBill) {
        const poLineCount = safeGetLineCount(vendorBill, 'purchaseorders');
        const poCandidateFields = ['id', 'internalid', 'apply', 'tranid', 'total', 'amountremaining'];
        const poLines = [];
        for (let i = 0; i < poLineCount; i++) {
            const poLine = { line: i };
            poCandidateFields.forEach(function (fieldId) {
                poLine[fieldId] = safeGetSublistValue(vendorBill, 'purchaseorders', fieldId, i);
            });
            poLines.push(poLine);
        }

        const itemLineCount = safeGetLineCount(vendorBill, 'item');
        const itemOrderDocs = [];
        for (let j = 0; j < itemLineCount; j++) {
            itemOrderDocs.push({
                line: j,
                item: safeGetSublistValue(vendorBill, 'item', 'item', j),
                orderdoc: safeGetSublistValue(vendorBill, 'item', 'orderdoc', j),
                orderline: safeGetSublistValue(vendorBill, 'item', 'orderline', j),
            });
        }

        log.debug({
            title: 'InstallmentPrevisionCopy | DEBUG TEMPORARIO - purchaseorders / orderdoc',
            details: JSON.stringify({
                vendorBillId: vendorBill.id,
                createdfrom: vendorBill.getValue({ fieldId: 'createdfrom' }),
                poLineCount: poLineCount,
                poLines: poLines,
                itemLineCount: itemLineCount,
                itemOrderDocs: itemOrderDocs,
            }),
        });
    }

    function safeGetLineCount(record, sublistId) {
        try {
            return record.getLineCount({ sublistId: sublistId });
        } catch (e) {
            return -1; // sublist não existe nesse record/contexto
        }
    }

    function safeGetSublistValue(record, sublistId, fieldId, line) {
        try {
            return record.getSublistValue({ sublistId: sublistId, fieldId: fieldId, line: line });
        } catch (e) {
            return '<erro: ' + ((e && e.message) || e) + '>';
        }
    }

    return { afterSubmit: afterSubmit };
});