/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
        "../../modulos/sc_pdi_utils_md"
    ],

    (utilsMd) => {


        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {


            if(scriptContext.type === scriptContext.UserEventType.DELETE) return true;

            const newRecord = scriptContext.newRecord;

            const isValid = utilsMd.isValidAllocationParam(newRecord);

            if(isValid) return true;

            throw new Error("⚠️ Certifique-se de que a soma das porcentagens informadas totaliza exatamente 100%. Por favor, revise os dados antes de prosseguir. ⚠️");

        }


        return {beforeSubmit}

    });
