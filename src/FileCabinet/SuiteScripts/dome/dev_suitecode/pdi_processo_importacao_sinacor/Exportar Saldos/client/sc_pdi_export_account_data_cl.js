/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
        "N/currentRecord",
        "N/search",
        "N/ui/dialog",
        "N/url",

    ],

    function (cRec, search, dialog, url) {

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

        function getAccBalance() {

            try {

                dialog.alert({title: "Processo iniciado...", message: "✅ Por favor, aguarde alguns instantes"}).then(() => {

                    const currentRecord = cRec.get();

                    const dataDe = currentRecord.getValue({fieldId: "custpage_date_from"});
                    const dataAte = currentRecord.getValue({fieldId: "custpage_date_to"});
                    const dataRelatorio = currentRecord.getValue({fieldId: "custpage_emit_report_date"});
                    const naoExportarZerados = currentRecord.getValue({fieldId: "custpage_export_with_values"});

                    if (!dataAte || !dataDe || !dataRelatorio) {

                        dialog.create({
                            title: "Não é possivel continuar...",
                            message: "❌ Por favor, preencha os campos <b>Data - DE</b>, <b>Data - ATE</b> e <b>Data de Emissão do Relatório</b>"
                        });

                        return true;

                    }

                    const serverScript = JSON.parse(currentRecord.getValue({fieldId: 'server_script'}))
                    window.onbeforeunload = true;
                    window.location.replace(url.resolveScript({
                        scriptId: serverScript.id,
                        deploymentId: serverScript.deploymentId,
                        params: {
                            dataDe: dataDe,
                            dataAte: dataAte,
                            dataRelatorio: dataRelatorio,
                            naoExportaContasZeradas: naoExportarZerados
                        }
                    }));

                });

            } catch (e) {
                console.error(e.message);
            }
        }

        function resetSL() {

            const currentRecord = cRec.get();

            const serverScript = JSON.parse(currentRecord.getValue({fieldId: 'server_script'}))

            window.onbeforeunload = true;
            window.location.replace(url.resolveScript({
                scriptId: serverScript.id,
                deploymentId: serverScript.deploymentId,
            }));
        }

        return {
            pageInit: pageInit,
            getAccBalance: getAccBalance,
            resetSL: resetSL
        };

    });
