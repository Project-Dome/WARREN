/**
 * @NApiVersion 2.1
 * @author Dome Solutions - Mário Augusto
 * @description Fonte única de fieldIds, scriptIds e recordTypes do módulo manage-vendor-bill.
 */
define([], function () {
    return {
        CUSTOM_TRANSACTIONS: {
            VENDOR_BILL: {
                TYPE: 'vendorbill',
                FIELDS: {
                    internalId: { name: 'internalid' }
                },
                SUBLISTS: {
                    ITEM: {
                        ID: 'item',
                        FIELDS: {
                            item: { name: 'item' },
                            amount: { name: 'amount' },
                            createdFrom: { name: 'orderdoc' }
                        }
                    }
                }
            },
            ITEM_RECEIPT: {
                TYPE: 'itemreceipt',
                SEARCH_TYPE: 'ItemRcpt',
                FIELDS: {
                    internalId: { name: 'internalid' },
                    createdFrom: { name: 'createdfrom' }
                }
            },
            PURCHASE_ORDER: {
                TYPE: 'purchaseorder',
                FIELDS: {
                    total: { name: 'total' },
                    internalId: { name: 'internalid' }
                }
            }
        },
        SCRIPTS: {
            VENDOR_BILL_LIMIT: {
                USER_EVENT: {
                    SCRIPT_ID: 'customscript_ds_mvb_vendor_bill_ue',
                    DEPLOY_ID: 'customdeploy_ds_mvb_vendor_bill_ue'
                },
                CLIENT_SCRIPT: {
                    SCRIPT_ID: 'customscript_ds_mvb_vendor_bill_cl',
                    DEPLOY_ID: 'customdeploy_ds_mvb_vendor_bill_cl'
                }
            }
        }
    }
});
