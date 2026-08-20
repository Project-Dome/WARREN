/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @author Dome Solutions - Mário Augusto
 * @description Lógica de negócio de acesso a dados de Purchase Order.
 */
define([
    '../ds_mvb_modules/ds-mvb-constants',
    '../ds_mvb_util/ds-mvb-search-data'
],

    function (
        constants,
        searchData
    ) {
        const TYPE = constants.CUSTOM_TRANSACTIONS.PURCHASE_ORDER.TYPE;
        const FIELDS = constants.CUSTOM_TRANSACTIONS.PURCHASE_ORDER.FIELDS;

        function getById(id) {
            return searchData.first({
                type: TYPE,
                fields: FIELDS,
                filters: [[FIELDS.internalId.name, 'anyof', id]]
            });
        }

        function getTotal(id) {
            const purchaseOrder = getById(id);
            log.audit({
                title: 'purchaseOrder',
                details: purchaseOrder
            })
            return purchaseOrder ? Number(purchaseOrder.total) || 0 : 0;
        }

        return {
            getById: getById,
            getTotal: getTotal
        }
    }
);
