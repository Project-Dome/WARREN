/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
        "N/ui/dialog",

        "../../modulos/sc_pdi_cts_md"

    ],

    function (dialog, cts) {


        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {

            try {

                const currentRecord = scriptContext.currentRecord;

                const isValid = isValidAllocationParam(currentRecord);

                if (!isValid) {


                    dialog.create({
                        title: "⚠️ A Soma das Porcentagens Deve Ser 100% ...",
                        message: "Certifique-se de que a soma das porcentagens informadas totaliza exatamente 100%. <br><br>Por favor, revise os dados antes de prosseguir."
                    }).then().catch()

                    return false;

                }

                return true;
            } catch (e) {
                log.error({
                    title: "ERROR IN - saveRecord",
                    details: e
                })
            }
        }

        const isValidAllocationParam = (paramRecord) => {

            try {

                let percentCount = 0;

                const detailLineCount = paramRecord.getLineCount({
                    sublistId: cts.CUSTOM_RECORD.PARAMETRO_ALOCACAO.SUBLIST
                });

                for (let index = 0; index < detailLineCount; index++) {

                    percentCount += paramRecord.getSublistValue({
                        sublistId: cts.CUSTOM_RECORD.PARAMETRO_ALOCACAO.SUBLIST,
                        fieldId: cts.CUSTOM_RECORD.DETALHE_PARAMETRO_ALOCACAO.FIELDS.PORCENTAGEM,
                        line: index
                    });

                }

                return percentCount === 100;

            } catch (e) {
                console.log({
                    title: "ERROR IN - isValidAllocationParam",
                    details: e
                });
            }
        }

        return {
            saveRecord: saveRecord
        };

    });
