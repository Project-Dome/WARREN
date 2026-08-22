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
    '../UseCases/CopyInstallmentPrevisions',
], function (CopyInstallmentPrevisions) {

    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE) return;

        const vendorBill = context.newRecord;
        const purchaseOrderId = vendorBill.getValue({ fieldId: 'createdfrom' });

        if (isNullOrEmpty(purchaseOrderId)) return;

        CopyInstallmentPrevisions.execute({
            purchaseOrderId: purchaseOrderId,
            vendorBillId: vendorBill.id,
        });
    }

    return { afterSubmit: afterSubmit };
});