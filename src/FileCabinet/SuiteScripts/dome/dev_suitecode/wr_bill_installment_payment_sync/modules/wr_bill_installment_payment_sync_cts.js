/**
* @NApiVersion 2.1
*/
define([], () => {

    return {
        TRANSACTION: {
            FIELDS: {
                TERMS: 'terms',
                PAYMENT_METHOD: 'custbody_pd_met_pagamento'
            },
            SUBLISTS: {
                INSTALLMENT: {
                    ID: 'installment',
                    FIELDS: {
                        PAYMENT_METHOD: 'custrecord_brl_inst_l_pay_method'
                    }
                }
            }
        },
    };
});