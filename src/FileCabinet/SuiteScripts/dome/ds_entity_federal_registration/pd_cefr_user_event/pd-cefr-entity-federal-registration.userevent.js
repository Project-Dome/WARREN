/**
 * @NAmdConfig /SuiteBundles/Bundle 444785/pd_p_netsuite_tools/pd-p-netsuite-tools.config.json
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
