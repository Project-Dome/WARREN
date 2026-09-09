/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @author ProjectDome
 * @description Vendor Bill (afterSubmit, CREATE) — copia as previsões de parcela
 * (customrecord_wr_installment_prevision) da(s) PO(s) de origem para a Vendor Bill
 * recém-criada. Docs/TECH-SPEC.md, seção 1.1.
 *
 * Script ID / deployment: ver Docs/MANIFEST.md — customscript_pd_ipc_vendor_bill_ue é
 * inferido do nome do arquivo (fase de design, ainda sem deploy). Confirmar/gerar o ID
 * real no ambiente NetSuite ao criar o registro de script.
 */
define([
    '../UseCases/CopyInstallmentPrevisions',
], function (CopyInstallmentPrevisions) {

    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE) return;

        const vendorBill = context.newRecord;
        const purchaseOrderIds = resolveSourcePurchaseOrderIds(vendorBill);

        if (isNullOrEmpty(purchaseOrderIds)) return;

        CopyInstallmentPrevisions.execute({
            purchaseOrderIds: purchaseOrderIds,
            vendorBillId: vendorBill.id,
        });
    }

    // Docs/TECH-SPEC.md, seção 1.1 "Identificação do(s) PO(s) de origem": lê todas as
    // linhas do sublist nativo purchaseorders (uma Vendor Bill pode ter mais de uma PO).
    // createdfrom é fallback defensivo, usado apenas quando o sublist está vazio.
    function resolveSourcePurchaseOrderIds(vendorBill) {
        const poLineCount = safeGetLineCount(vendorBill, 'purchaseorders');
        const ids = [];

        for (let line = 0; line < poLineCount; line++) {
            const id = vendorBill.getSublistValue({ sublistId: 'purchaseorders', fieldId: 'id', line: line });
            if (!isNullOrEmpty(id)) ids.push(id);
        }

        if (!isNullOrEmpty(ids)) return ids;

        const createdFromId = vendorBill.getValue({ fieldId: 'createdfrom' });
        return isNullOrEmpty(createdFromId) ? [] : [createdFromId];
    }

    function safeGetLineCount(record, sublistId) {
        try {
            return record.getLineCount({ sublistId: sublistId });
        } catch (e) {
            return 0; // sublist não existe nesse record/contexto
        }
    }

    return { afterSubmit: afterSubmit };
});