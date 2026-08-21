/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
        "N/ui/serverWidget",
        "N/record",

        "../../modulos/sc_pdi_utils_md"
    ],

    (serverWidget, record, utilsMd) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            try {

                const {
                    request,
                    response
                } = scriptContext;

                const {
                    method,
                    parameters
                } = request;

                const form = serverWidget.createForm({title: "Enviar Configuração"});

                if(method === "POST") utilsMd.setConfigData(parameters);

                const configValues = utilsMd.getConfigData();

                return response.writePage({pageObject: createForm(form, configValues)});


            } catch (e) {
                log.error({
                    title: "ERROR IN - onRequest",
                    details: e
                });
            }
        }

        const createForm = (form, parameters) => {

            try {

                form.addFieldGroup({
                    id: "custpage_pastas",
                    label: "Pastas"
                });

                form.addField({
                    id: "custpage_arquivo_pasta_padrao",
                    label: "Pasta padrão arquivo importado",
                    type: serverWidget.FieldType.TEXT,
                    container: "custpage_pastas",
                }).isMandatory = true;

                form.addField({
                    id: "custpage_arquivo_exportado",
                    label: "Pasta padrão arquivo exportado",
                    type: serverWidget.FieldType.TEXT,
                    container: "custpage_pastas",
                }).isMandatory = true;

                form.addFieldGroup({
                    id: "custpage_acc",
                    label: "Contas"
                });

                form.addField({
                    id: "custpage_round_acc",
                    label: "Conta Padrão de Arredondamento",
                    type: serverWidget.FieldType.SELECT,
                    container: "custpage_acc",
                    source: record.Type.ACCOUNT
                }).isMandatory = true;

                form.addFieldGroup({
                    id: "custpage_permissions",
                    label: "Permissões"
                });

                form.addField({
                    id: "custpage_btn_criar_previa",
                    label: "Botão Criar Prévia",
                    container: "custpage_permissions",
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'role'
                });

                form.addField({
                    id: "custpage_btn_gerar_lancamento",
                    label: "Botão Gerar Lançamento",
                    container: "custpage_permissions",
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'role'
                });

                form.addField({
                    id: "custpage_btn_excluir_lancamento",
                    label: "Botão Excluir Lançamento",
                    container: "custpage_permissions",
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'role'
                });

                form.addField({
                    id: "custpage_btn_repro_previa",
                    label: "Botão Reprocessar Prévia",
                    container: "custpage_permissions",
                    type: serverWidget.FieldType.MULTISELECT,
                    source: 'role'
                });

                form.addFieldGroup({
                    id: "custpage_export",
                    label: "Exportação",
                });

                form.addField({
                    id: "custpage_column_export",
                    label: "Coluna Lançamento Padrão",
                    container: "custpage_export",
                    type: serverWidget.FieldType.TEXT,
                })

                form.updateDefaultValues({
                    "custpage_arquivo_pasta_padrao": parameters["pastaArquivoImportado"],
                    "custpage_btn_criar_previa": parameters["btnCriarPrevia"],
                    "custpage_btn_gerar_lancamento": parameters["btnGerarLancamento"],
                    "custpage_btn_excluir_lancamento": parameters["btnExcluirLancamento"],
                    "custpage_btn_repro_previa": parameters["btnReprocessarPrevia"],
                    "custpage_round_acc": parameters["accDefaultRound"],
                    "custpage_arquivo_exportado": parameters["pastaArquivoExportado"],
                    "custpage_column_export": parameters["colunaLancamentoPadrao"],
                });

                form.addSubmitButton({
                    label: "Enviar Configuração"
                });

                return form;

            } catch (e) {
                log.error({
                    title: "ERROR IN - createForm",
                    details: e
                });
            }
        }

        return {onRequest}

    });
