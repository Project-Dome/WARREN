/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
        "N/https",
        "N/runtime",
        "N/task",

        "../../modulos/sc_pdi_cts_md",
        "../../modulos/sc_pdi_utils_md"
    ],

    (https, runtime, task, cts, utilsMd) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

            try {

                const form = scriptContext.form;

                if (scriptContext.type !== scriptContext.UserEventType.VIEW) return true;

                const newRecord = scriptContext.newRecord;
                const newRecordId = newRecord.id;

                const {
                    btnCriarPrevia,
                    btnGerarLancamento,
                    btnExcluirLancamento,
                    btnReprocessarPrevia
                } = utilsMd.getConfigData();

                const role = String(runtime.getCurrentUser().role);

                form.clientScriptModulePath = "../client/sc_pdi_registro_importacao_cl";

                const importacaoStatus = newRecord.getValue({
                    fieldId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_INTEGRACAO
                });

                const previewStatus = newRecord.getValue({
                    fieldId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_PREVISAO
                });

                const journalStatus = newRecord.getValue({
                    fieldId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_LANCAMENTO
                });

                if (btnCriarPrevia.includes(role)) {
                    if (importacaoStatus == cts.LIST.STATUS_IMPORTACAO.VALUES.CONCLUIDO &&
                        (previewStatus == cts.LIST.STATUS_IMPORTACAO.VALUES.PENDENTE || previewStatus == cts.LIST.STATUS_IMPORTACAO.VALUES.ERRO))
                        form.addButton({
                            label: "SC - Gerar Prévia",
                            id: "custpage_gerar_previa",
                            functionName: `generatePreview(${newRecordId}, ${false})`
                        });
                }

                if (previewStatus == cts.LIST.STATUS_IMPORTACAO.VALUES.CONCLUIDO && (
                        journalStatus == cts.LIST.STATUS_IMPORTACAO.VALUES.PENDENTE || journalStatus == cts.LIST.STATUS_IMPORTACAO.VALUES.ERRO)
                    && importacaoStatus == cts.LIST.STATUS_IMPORTACAO.VALUES.CONCLUIDO) {

                    if (btnReprocessarPrevia.includes(role)) {
                        form.addButton({
                            label: "SC - Reprocessar Prévia",
                            id: "custpage_reprocessar_previa",
                            functionName: `generatePreview(${newRecordId}, ${true})`
                        });
                    }

                    if (btnGerarLancamento.includes(role)) {
                        form.addButton({
                            label: "SC - Gerar Lançamento",
                            id: "custpage_gerar_lancamento",
                            functionName: `generateJournal(${newRecordId})`
                        });
                    }

                }

                if (btnExcluirLancamento.includes(role)) {
                    if (journalStatus == cts.LIST.STATUS_IMPORTACAO.VALUES.CONCLUIDO) {

                        const subsidiary = newRecord.getValue({
                            fieldId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.SUBSIDIARIA
                        });

                        const lastTransactionId = utilsMd.getLastImportRecordJournal(subsidiary);

                        if (newRecordId == lastTransactionId) form.addButton({
                            label: "SC - Excluir Lançamentos",
                            id: "custpage_excluir_lancamento",
                            functionName: `deleteJournals(${newRecordId})`
                        });

                    }
                }

            } catch (e) {
                log.error({
                    title: "ERROR IN - beforeLoad",
                    details: e
                });
            }
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

            try {

                if (scriptContext.type !== scriptContext.UserEventType.EDIT && scriptContext.type !== scriptContext.UserEventType.XEDIT) return true;

                const newRecord = scriptContext.newRecord;
                const newRecordId = newRecord.id;

                const importStatus = newRecord.getValue({fieldId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_INTEGRACAO});

                if (importStatus != cts.LIST.STATUS_IMPORTACAO.VALUES.SUBSTITUIDO) return true;

                const journalStatus = newRecord.getValue({fieldId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_LANCAMENTO});

                if (journalStatus != cts.LIST.STATUS_IMPORTACAO.VALUES.CONCLUIDO && journalStatus != cts.LIST.STATUS_IMPORTACAO.VALUES.EM_ANDAMENTO) return true;

                //CHAMANDO O RESTLET
                // const rlResponse = https.requestRestlet({
                //     scriptId: "customscript_sc_pdi_journal_delete_rl",
                //     deploymentId: "customdeploy_sc_pdi_journal_delete_rl",
                //     body: JSON.stringify(newRecordId),
                //     method: "POST",
                //     headers: {
                //         "Content-Type": "application/json"
                //     }
                // });
                //Comentado pois iremos utilizar o reprocessamento de exclusão
                // task.create({
                //     taskType: task.TaskType.MAP_REDUCE,
                //     scriptId: "customscript_sc_pdi_delete_journal_mr",
                //     params: {
                //         "custscript_sc_pdi_delete_param": newRecordId
                //     }
                // }).submit();

            } catch (e) {
                log.error({
                    title: "ERROR IN - afterSubmit",
                    details: e
                });
            }
        }


        return {beforeLoad, afterSubmit}

    });
