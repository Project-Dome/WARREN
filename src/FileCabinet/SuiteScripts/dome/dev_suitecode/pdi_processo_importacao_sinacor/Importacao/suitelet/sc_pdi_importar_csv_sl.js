/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
        "N/ui/serverWidget",
        "N/runtime",
        "N/task",
        "N/redirect",
        "N/record",

        "../../modulos/sc_pdi_utils_md",
        "../../modulos/sc_pdi_cts_md"
    ],

    (serverWidget, runtime, task, redirect, record, utilsMd, cts) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            try {

                const request = scriptContext.request;
                const response = scriptContext.response;
                const configData = utilsMd.getConfigData();
                const csvFolder = configData["pastaArquivoImportado"];

                const {
                    method,
                    parameters,
                    files
                } = request;

                if (!csvFolder) throw new Error(`⚠️ Pasta padrão de importação está em branco. Preencha no registro de configurações. ⚠️`);

                const form = serverWidget.createForm({title: "Processo de Importação"})
                form.clientScriptModulePath = "../client/sc_pdi_importar_csv_cl";

                if (method === "GET") return response.writePage({pageObject: createForm(form)});

                if (method === "POST") {

                    const fileData = files["custpage_arquivo_importado"];
                    fileData["folder"] = csvFolder;

                    const fileId = utilsMd.createFile(fileData);

                    if (!fileId) throw new Error("⚠️ O ocorreu algum erro ao tentar criar o arquivo. ⚠️");

                    const subsidiaryId = parameters["custpage_subsidiaria"];

                    const importRecordId = utilsMd.createImportRecord(fileId, subsidiaryId);

                    if (!importRecordId) throw new Error("⚠️ O ocorreu algum erro ao tentar criar o registro de importação. ⚠️");

                    const reprocessar = parameters["custpage_reprocessar"];
                    const ultimoProcessado = parameters["custpage_last_process"];

                    if (reprocessar && ultimoProcessado) {

                        const ultimoProcessadoAlterado = utilsMd.replacedImportRecord(ultimoProcessado, importRecordId);

                        if(!ultimoProcessadoAlterado) throw new Error("⚠️ O ocorreu algum erro ao tentar substituir o registro de importação. ⚠️");

                        log.audit({
                            title: "*** REGISTRO SUBSTITUIDO ***",
                            details: ultimoProcessadoAlterado
                        });

                    }

                    const params = {
                        fileId: fileId,
                        importRecordId: importRecordId
                    }

                    const taskID = createTask(params);

                    log.audit({
                        title: "*** TASK ID ***",
                        details: taskID
                    });

                    redirect.toRecord({
                        type: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.ID,
                        id: importRecordId,
                        isEditMode: false
                    });

                }

            } catch (e) {
                log.error({
                    title: "ERROR IN - onRequest",
                    details: e
                });
            }
        }

        const createForm = (form) => {

            try {

                form.addField({
                    label: "Subsidiaria",
                    id: "custpage_subsidiaria",
                    type: serverWidget.FieldType.SELECT,
                    source: record.Type.SUBSIDIARY
                }).isMandatory = true;

                form.addField({
                    label: "Arquivo Importado",
                    id: "custpage_arquivo_importado",
                    type: serverWidget.FieldType.FILE,
                }).isMandatory = true;

                form.addField({
                    label: "Reprocessar",
                    id: "custpage_reprocessar",
                    type: serverWidget.FieldType.CHECKBOX,
                });

                form.addField({
                    label: "Ultimo Processamento",
                    id: "custpage_last_process",
                    type: serverWidget.FieldType.SELECT,
                    source: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.ID,
                }).updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

                form.addSubmitButton({
                    label: "Processar Arquivo",
                });

                return form;

            } catch (e) {
                log.error({
                    title: "ERROR IN - createForm",
                    details: e
                });
            }
        }

        const createTask = (parameters) => {

            try {

                return task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: "customscript_sc_pdi_archive_process_mr",
                    params: {
                        "custscript_sc_pdi_mr_process_param": JSON.stringify(parameters),
                    }
                }).submit()

            } catch (e) {
                log.error({
                    title: "ERROR IN - createTask",
                    details: e
                });
            }
        }

        return {onRequest}

    });
