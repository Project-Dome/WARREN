/**
 * @NAmdConfig /SuiteScripts/dev_suitecode/pd_c_netsuite_tools/pd-c-netsuite-tools.config.json
 * *******************************************************************************************
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    '../pd_cefr_service/pd-cefr-entity.service'
], function (entity_service) {

    function beforeSubmit(context) {
        entity_service.manageFederalRegistrationByServer(context);
        entity_service.manageInternationalRegistrationByServer(context);
    }

    return {
        beforeSubmit: beforeSubmit
    }
});
