/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(
    [
        'N/record', 
        'N/search',

        './../service/pd-vbi-sv-vendorbill-details'
    ], function(
        record, 
        search,

        vendorbill_details_service
    ) {

        function beforeLoad(context) {
            
        }

        function beforeSubmit(context) {
            
        }

        function afterSubmit(context) {
            let _isCreateOrEdit = (
                    context.type === context.UserEventType.CREATE
                ||  context.type === context.UserEventType.EDIT
            );
            
            if (!_isCreateOrEdit) {
                return;
            }

            vendorbill_details_service.updateVendorBill(context.newRecord.id);
        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        }
});
