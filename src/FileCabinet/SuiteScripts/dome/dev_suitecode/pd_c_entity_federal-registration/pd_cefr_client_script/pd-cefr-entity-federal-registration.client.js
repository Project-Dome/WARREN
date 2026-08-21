/**
 * @NAmdConfig /SuiteScripts/dev_suitecode/pd_c_netsuite_tools/pd-c-netsuite-tools.config.json
 * *******************************************************************************************
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(
    [
        '../pd_cefr_service/pd-cefr-entity.service'
    ],
    function (
        entity_service
    ) {

        function pageInit(context) {
          return  entity_service.manageFederalRegistrationPageInit(context);
        }

        function fieldChanged(context) {
            return entity_service.manageFederalRegistration(context) && entity_service.manageDisabled(context);
        }

        function saveRecord(context) {
            return entity_service.manageFederalRegistrationForSavedRecord(context)
        }

        return {
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            pageInit: pageInit
        }
    }
);
