/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @author Dome Solutions - Mário Augusto
 * @description Lógica de negócio de acesso a dados de Item Receipt.
 */
define([
        'N/record',
        '../ds_mvb_modules/ds-mvb-constants',
        '../ds_mvb_util/ds-mvb-get-data'
    ],

    function (
        record,
        constants,
        getData
    ) {
        const TYPE = constants.CUSTOM_TRANSACTIONS.ITEM_RECEIPT.TYPE;
        const FIELDS = constants.CUSTOM_TRANSACTIONS.ITEM_RECEIPT.FIELDS;

        function load(id) {
            return record.load({ type: TYPE, id: id });
        }

        function getBodyFieldsData(itemReceiptRecord) {
            return getData.bodyFields(FIELDS, itemReceiptRecord);
        }

        return {
            load: load,
            getBodyFieldsData: getBodyFieldsData
        }
    }
);
