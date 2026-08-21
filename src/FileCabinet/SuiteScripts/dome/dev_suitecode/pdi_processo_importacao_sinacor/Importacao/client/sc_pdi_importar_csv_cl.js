/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
        "N/search",


        "../../modulos/sc_pdi_cts_md"
    ],

function(search, cts) {
    

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {

        try {

            const currentRecord = scriptContext.currentRecord;
            const currentField = scriptContext.fieldId

            switch (currentField) {
                case "custpage_subsidiaria":
                case "custpage_reprocessar":

                    const subsidiaria = currentRecord.getValue({
                        fieldId: "custpage_subsidiaria"
                    });

                    const reprocessar = currentRecord.getValue({
                        fieldId: "custpage_reprocessar"
                    });

                    if(subsidiaria && reprocessar) {

                        let lastTransactionId = getLastImportRecord(subsidiaria);

                        if(!lastTransactionId) {
                            setFalseValue(currentRecord);
                            return true;
                        }

                        currentRecord.setValue({
                            fieldId: "custpage_last_process",
                            value: lastTransactionId,
                            ignoreFieldChange: true
                        });

                    } else {
                        setFalseValue(currentRecord);
                    }

                break;

            }

        } catch (e) {
            console.error({
                title: "ERROR IN - fieldChanged",
                details: e
            });
        }
    }

    function setFalseValue(currentRecord) {
        currentRecord.setValue({
            fieldId: "custpage_reprocessar",
            value: false,
            ignoreFieldChange: true
        });
    }

    function getLastImportRecord (subsidiaryId){

        try {

            let lastTransaction;

            search.create({
                type: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.ID,
                filters: [
                    search.createFilter({
                        name: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.SUBSIDIARIA,
                        operator: search.Operator.ANYOF,
                        values: subsidiaryId
                    }),
                    search.createFilter({
                        name: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_INTEGRACAO,
                        operator: search.Operator.ANYOF,
                        values: cts.LIST.STATUS_IMPORTACAO.VALUES.CONCLUIDO
                    })
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP",
                        sort: search.Sort.DESC
                    })
                ]
            }).run().getRange({start: 0, end: 1}).forEach((result) => {
                lastTransaction = result.getValue({
                    name: "internalid",
                    summary: "GROUP"
                })
            });

            return lastTransaction;

        } catch (e) {
            console.error({
                title: "ERROR IN - getLastImportRecord",
                details: e
            });
        }
    }

    return {
        fieldChanged: fieldChanged
    };
    
});
