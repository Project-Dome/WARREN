/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
        "N/task"
    ],

    (task) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            try {

                const {request} = scriptContext;

                const {
                    registroImportacao,
                    isReprocessar,
                    mrId
                } = JSON.parse(request.body);

                const params = {}

                if (mrId === "customscript_sc_pdi_create_preview_mr") {

                    params["custscript_sc_preview_param"] = JSON.stringify({
                        registroImportacao: registroImportacao,
                        isReprocessar: isReprocessar
                    });

                }

                if (mrId === "customscript_sc_pdi_create_journal_mr") params["custscript_sc_pdi_journal_param"] = registroImportacao;
                if (mrId === "customscript_sc_pdi_delete_journal_mr") params["custscript_sc_pdi_delete_param"] = registroImportacao;

                return task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: mrId,
                    params: params
                }).submit();

            } catch (e) {
                log.error({
                    title: "ERROR IN - onRequest",
                    details: e
                });
            }
        }

        return {onRequest}

    });
