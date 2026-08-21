/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @author Dome Solutions - Mário Augusto
 * @description Bloqueia o salvamento de Vendor Bill cujo valor ultrapasse 20% do valor da PO de origem
 */
define([
        'N/ui/dialog',
        '../ds_mvb_service/ds-mvb-vendor-bill-limit.service'
    ],

    function (
        dialog,
        vbPoLimitService
    ) {

        function saveRecord(context) {

            try {

                const result = vbPoLimitService.validate(context.currentRecord);

                if (result.blocked) {
                    dialog.alert({
                        title: 'Limite de 20% excedido',
                        message: result.message
                    });

                    return false;
                }

                return true;

            } catch (e) {

                log.error({
                    title: 'ERROR IN - saveRecord',
                    details: {
                        stack: e.stack,
                        message: e.message
                    }
                });

                return true;

            }

        }

        return { saveRecord: saveRecord }

    }
);
