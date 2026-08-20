/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @author Dome Solutions - Mário Augusto
 * @description Lógica de negócio de acesso a dados de Vendor Bill.
 */
define([
        '../ds_mvb_modules/ds-mvb-constants',
        '../ds_mvb_util/ds-mvb-get-data'
    ],

    function (
        constants,
        getData
    ) {
        const FIELDS = constants.CUSTOM_TRANSACTIONS.VENDOR_BILL.FIELDS;
        const ITEM_SUBLIST = constants.CUSTOM_TRANSACTIONS.VENDOR_BILL.SUBLISTS.ITEM;

        function getBodyFieldsData(vendorBillRecord) {
            return getData.bodyFields(FIELDS, vendorBillRecord);
        }

        function getLines(vendorBillRecord) {
            return getData.sublistFields(ITEM_SUBLIST.FIELDS, vendorBillRecord, ITEM_SUBLIST.ID);
        }

        return {
            getBodyFieldsData: getBodyFieldsData,
            getLines: getLines
        }
    }
);
