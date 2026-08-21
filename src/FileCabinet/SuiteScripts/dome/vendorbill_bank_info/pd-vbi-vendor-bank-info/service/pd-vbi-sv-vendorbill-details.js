/**
 *@NApiVersion 2.1
 */
define(   
    [
        'N/log',
        'N/record', 
        'N/search',

        './../../libs/contents'
    ], function(
        log,
        record, 
        search,

        contents
    ) {

        function getBankPrefer(vendorId){
            let _bankPrefer = {}
            const TYPE =  contents.record_type.vendor_payment_prefer.type;

            const SEARCH_COLUMNS = {
                vendor_id:          contents.record_type.vendor_payment_prefer.fields.vendor_id,
                bank:               contents.record_type.vendor_payment_prefer.fields.bank,
                ag_number:          contents.record_type.vendor_payment_prefer.fields.ag_number,
                dv_agence:          contents.record_type.vendor_payment_prefer.fields.dv_agence,
                cc_number:          contents.record_type.vendor_payment_prefer.fields.cc_number,
                dv_account_current: contents.record_type.vendor_payment_prefer.fields.dv_account_current,
                type_pix_key:       contents.record_type.vendor_payment_prefer.fields.type_pix_key,
                pix_key:            contents.record_type.vendor_payment_prefer.fields.pix_key,
                default:            contents.record_type.vendor_payment_prefer.fields.default
            }

                
            let _bankPreferResult = search.create({
                type: TYPE,
                filters:[
                    [SEARCH_COLUMNS.vendor_id, 'ANYOF', vendorId],
                    'AND',
                    [ SEARCH_COLUMNS.default, 'IS', 'T']
                ],
                columns:[
                    SEARCH_COLUMNS.bank,
                    SEARCH_COLUMNS.ag_number,
                    SEARCH_COLUMNS.dv_agence,
                    SEARCH_COLUMNS.cc_number,
                    SEARCH_COLUMNS.dv_account_current,
                    SEARCH_COLUMNS.type_pix_key,
                    SEARCH_COLUMNS.pix_key
                ]
            }).run().each(function(result){

                _bankPrefer.bank                = result.getValue(SEARCH_COLUMNS.bank);
                _bankPrefer.ag_number           = result.getValue(SEARCH_COLUMNS.ag_number);
                _bankPrefer.dv_agence           = result.getValue(SEARCH_COLUMNS.dv_agence);
                _bankPrefer.cc_number           = result.getValue(SEARCH_COLUMNS.cc_number);
                _bankPrefer.dv_account_current  = result.getValue(SEARCH_COLUMNS.dv_account_current);
                _bankPrefer.type_pix_key        = result.getValue(SEARCH_COLUMNS.type_pix_key);
                _bankPrefer.pix_key             = result.getValue(SEARCH_COLUMNS.pix_key);

                return true;
            });

            return _bankPrefer;
        }

        function updateVendorBill(billId){

            const TYPE =  contents.transaction_type.vendor_bill.type;

            const FIELDS = {
                bank:                       contents.transaction_type.vendor_bill.fields.bank,
                vendor:                     contents.transaction_type.vendor_bill.fields.vendor,
                pix_key:                    contents.transaction_type.vendor_bill.fields.pix_key,
                agence:                     contents.transaction_type.vendor_bill.fields.agence,
                payment_method:             contents.transaction_type.vendor_bill.fields.payment_method,
                account_bank:               contents.transaction_type.vendor_bill.fields.account_bank
            };

            let _billRecord = record.load({
                type: TYPE,
                id: billId
            });

            let _paymentMethod = _billRecord.getValue(FIELDS.payment_method);

            if(!_paymentMethod) return;

            let _vendorId = _billRecord.getValue(FIELDS.vendor);
            let _bankPreferValues = getBankPrefer(_vendorId);

            if(!_bankPreferValues) return;

            _billRecord.setValue(FIELDS.bank, _bankPreferValues.bank);
            _billRecord.setValue(FIELDS.pix_key, _bankPreferValues.pix_key);
            _billRecord.setValue(FIELDS.agence, _bankPreferValues.ag_number);
            _billRecord.setValue(FIELDS.account_bank, _bankPreferValues.cc_number);

            _billRecord.save();
        }

        return {
            getBankPrefer, updateVendorBill
        }
    }
);
