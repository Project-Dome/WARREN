/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @author Dome Solutions - Mário Augusto
 * @description Bloqueia a criacao de Vendor Bill cujo valor ultrapasse 20% do valor da PO de origem
 */
define([
    '../ds_mvb_service/ds-mvb-vendor-bill-limit.service'
], function (
    vbPoLimitService
) {

    function beforeSubmit(context) {

        try {

            if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) return;

            const result = vbPoLimitService.validate(context.newRecord);

            if (result.blocked) {
                throw result.message;
            }

        } catch (e) {

            log.error({
                title: 'ERROR IN - beforeSubmit',
                details: e
            });

            throw e;

        }

    }

    return { beforeSubmit: beforeSubmit }

});
