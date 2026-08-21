/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([
        "N/record",
        "N/url",
        "N/https",
        "N/ui/message",
        "N/ui/dialog",

        "../../modulos/sc_pdi_cts_md"
    ],

    function (record, url, https, message, dialog, cts) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {

        }

        function generatePreview(newRecordId, isReprocessar) {

            try {

                //CHAMANDO O RESTLET
                // const currentRecord = record.load({
                //     id: newRecordId,
                //     type: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.ID
                // });
                // const rlUrl = url.resolveScript({
                //     scriptId: "customscript_sc_pdi_create_preview_rl",
                //     deploymentId: "customdeploy_sc_pdi_create_preview_rl"
                // });
                //
                // const body = {
                //     subsidiary: currentRecord.getValue({fieldId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.SUBSIDIARIA}),
                //     registroImportacao: newRecordId,
                // }
                //
                // https.post.promise({
                //     url: rlUrl,
                //     body: JSON.stringify(body),
                //     headers: {
                //         "Content-Type": "application/json"
                //     }
                // }).then().catch();

                const rlUrl = url.resolveScript({
                    scriptId: "customscript_sc_pdi_trigger_mr_sl",
                    deploymentId: "customdeploy_sc_pdi_trigger_mr_sl"
                });

                const body = {
                    registroImportacao: newRecordId,
                    isReprocessar: isReprocessar,
                    mrId: "customscript_sc_pdi_create_preview_mr"
                }

                https.post.promise({
                    url: rlUrl,
                    body: JSON.stringify(body),
                    headers: {
                        "Content-Type": "application/json"
                    }
                }).then().catch();

                processMessagem();

                updateImportRecordStatus({
                    importRecordId: newRecordId,
                    statusField: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_PREVISAO,
                    status: cts.LIST.STATUS_IMPORTACAO.VALUES.PENDENTE
                });

                setTimeout(() => {
                    window.onbeforeunload = true;
                    window.location.reload();
                }, 10000);

            } catch (e) {

                updateImportRecordStatus({
                    importRecordId: newRecordId,
                    statusField: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_PREVISAO,
                    status: cts.LIST.STATUS_IMPORTACAO.VALUES.ERRO,
                    errorMessage: e
                });

                console.error({
                    title: "ERROR IN - generatePreview()",
                    details: e
                });
            }
        }

        function generateJournal(newRecordId) {

            try {
                //CHAMANDO RESTLET
                // const rlUrl = url.resolveScript({
                //     scriptId: "customscript_sc_pdi_create_journal_rl",
                //     deploymentId: "customdeploy_sc_pdi_create_journal_rl"
                // });
                //
                // https.post.promise({
                //     url: rlUrl,
                //     body: newRecordId,
                //     headers: {
                //         "Content-Type": "application/json"
                //     }
                // }).then().catch();

                const rlUrl = url.resolveScript({
                    scriptId: "customscript_sc_pdi_trigger_mr_sl",
                    deploymentId: "customdeploy_sc_pdi_trigger_mr_sl"
                });

                const body = {
                    registroImportacao: newRecordId,
                    mrId: "customscript_sc_pdi_create_journal_mr"
                }

                https.post.promise({
                    url: rlUrl,
                    body: JSON.stringify(body),
                    headers: {
                        "Content-Type": "application/json"
                    }
                }).then().catch();

                processMessagem();

                updateImportRecordStatus({
                    importRecordId: newRecordId,
                    statusField: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_LANCAMENTO,
                    status: cts.LIST.STATUS_IMPORTACAO.VALUES.PENDENTE
                });

                setTimeout(() => {
                    window.onbeforeunload = true;
                    window.location.reload();
                }, 10000);

            } catch (e) {

                updateImportRecordStatus({
                    importRecordId: newRecordId,
                    statusField: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_LANCAMENTO,
                    status: cts.LIST.STATUS_IMPORTACAO.VALUES.ERRO,
                    errorMessage: e
                });

                console.error({
                    title: "ERROR IN - generatePreview()",
                    details: e
                });
            }
        }

        function deleteJournals(newRecordId) {

            try {

                createJournalExcludeMsg().then((result) => {

                    if (result === "N") return true;

                    //CHAMANDO RESTLET
                    // const rlUrl = url.resolveScript({
                    //     scriptId: "customscript_sc_pdi_journal_delete_rl",
                    //     deploymentId: "customdeploy_sc_pdi_journal_delete_rl"
                    // });
                    //
                    // https.post.promise({
                    //     url: rlUrl,
                    //     body: newRecordId,
                    //     headers: {
                    //         "Content-Type": "application/json"
                    //     }
                    // }).then().catch();

                    const rlUrl = url.resolveScript({
                        scriptId: "customscript_sc_pdi_trigger_mr_sl",
                        deploymentId: "customdeploy_sc_pdi_trigger_mr_sl"
                    });

                    const body = {
                        registroImportacao: newRecordId,
                        mrId: "customscript_sc_pdi_delete_journal_mr"
                    }

                    https.post.promise({
                        url: rlUrl,
                        body: JSON.stringify(body),
                        headers: {
                            "Content-Type": "application/json"
                        }
                    }).then().catch();

                    processMessagem();

                    setTimeout(() => {
                        window.onbeforeunload = true;
                        window.location.reload();
                    }, 10000);

                });

            } catch (e) {
                log.debug({
                    title: "ERROR IN - deleteJournal",
                    details: e
                })
            }
        }

        function createJournalExcludeMsg() {

            try {
                return dialog.create({
                    title: "⚠️ Exclusão de Lançamentos ⚠️",
                    message: "<b>Atenção!</b><br><br> Ao excluir estes lançamentos, eles não poderão ser recriados manualmente. Apenas uma nova importação poderá gerar novos lançamentos. Deseja continuar?",
                    buttons: [
                        {value: "S", label: "Sim"},
                        {value: "N", label: "Não"}
                    ]
                });
            } catch (e) {
                console.error({
                    title: "ERROR IN - createJournalExcludeMsg",
                    details: e
                });
            }
        }


        function processMessagem() {
            return message.create({
                title: "Processo Iniciado com Sucesso...",
                message: "O processo foi iniciado com sucesso e está em andamento. Acompanhe o registro para mais atualizações.",
                type: message.Type.CONFIRMATION,
                duration: 10000
            }).show();
        }

        function updateImportRecordStatus({importRecordId, statusField, status, errorMessage}) {

            try {

                const values = {
                    "custrecord_pdi_imp_error_msg_ds": errorMessage
                };

                values[statusField] = status;

                record.submitFields({
                    type: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.ID,
                    id: importRecordId,
                    values: values
                });


            } catch (e) {
                log.error({
                    title: "ERROR IN - updateImportRecordStatus",
                    details: e
                });
            }
        }

        return {
            pageInit: pageInit,
            generatePreview: generatePreview,
            generateJournal: generateJournal,
            deleteJournals: deleteJournals
        };

    });
