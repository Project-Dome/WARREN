/**
 *@NApiVersion 2.1
 */
define([], function() {

    return {
        transaction_type:{
            vendor_bill:{
                type: 'vendorbill',
                fields: {
                    id: 'internalid',
                    vendor: 'entity',
                    payment_method: 'custbody_pd_met_pagamento',
                    bank: 'custbody_pd_nome_banco',
                    agence: 'custbody_pd_agencia',
                    account_bank: 'custbody_pd_conta_bancaria',
                    pix_key: 'custbody_pd_chave_pix'
                }
            }
        },
        record_type:{
            vendor_payment_prefer: {
                type: 'customrecord_brl_vendor_payment_prefer',
                fields:{
                    type_prefer_info: 'custrecord_brl_venpaytpref_l_payt_info',
                    vendor_id: 'custrecord_brl_venpaytpref_l_vendor',
                    bank: 'custrecord_brl_venpaytpref_l_bank',
                    ag_number: 'custrecord_brl_venpaytpref_t_branch',
                    dv_agence: 'custrecord_brl_venpaytpref_l_branch_dig',
                    cc_number: 'custrecord_brl_venpaytpref_t_acct_number',
                    dv_account_current: 'custrecord_brl_venpaytpref_t_acct_digit', // conta corrente
                    type_pix_key: 'custrecord_brl_venpaytpref_l_pixkey_type',
                    pix_key: 'custrecord_brl_venpaytpref_t_pixkey',
                    default: 'custrecord_brl_venpaytpref_f_default'
                }
            }
        }
    }
});
