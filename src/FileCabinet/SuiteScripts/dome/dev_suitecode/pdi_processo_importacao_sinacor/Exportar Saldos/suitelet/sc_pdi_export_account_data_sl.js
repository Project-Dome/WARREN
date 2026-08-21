/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
        "N/ui/serverWidget",
        "N/runtime",
        "N/record",
        "N/redirect",
        "N/format",

        "../../modulos/sc_pdi_cts_md",
        "../../modulos/sc_pdi_utils_md"

    ],

    (serverWidget, runtime, record, redirect, format, cts, utilsMd) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            try {

                const {request, response} = scriptContext;

                const {method, parameters} = request;

                switch (method) {

                    case "GET":

                        const form = serverWidget.createForm({title: "Exportar Saldos Contábeis "});
                        form.clientScriptModulePath = "../client/sc_pdi_export_account_data_cl";
                        response.writePage({pageObject: createForm(form, parameters)});

                        break;

                    case "POST":

                        const exportRecordId = createExportRecord(parameters, request);

                        if(!exportRecordId) return false;

                        redirect.toRecord({
                            id: exportRecordId,
                            type: cts.CUSTOM_RECORD.REGISTRO_EXPORTACAO.ID
                        });

                        break;

                }


            } catch (e) {
                log.error({
                    title: "ERROR IN - onRequest",
                    details: e
                });
            }
        }

        const createForm = (form, parameters) => {

            const {
                dataDe,
                dataAte,
                dataRelatorio,
                accountsBalance,
                naoExportaContasZeradas
            } = parameters;

            log.debug({
                title: "parameters",
                details: parameters,
            });

            form.addFieldGroup({
                id: "custpage_filtros",
                label: "Filtros"
            });

            const dataDeField = form.addField({
                id: "custpage_date_from",
                label: "Data - DE",
                type: serverWidget.FieldType.DATE,
                container: "custpage_filtros"
            });

            dataDeField.isMandatory = true;

            const dataAteField = form.addField({
                id: "custpage_date_to",
                label: "Data - ATE",
                type: serverWidget.FieldType.DATE,
                container: "custpage_filtros"
            });

            dataAteField.isMandatory = true;

            form.addField({
                id: 'server_script',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Server Script'
            })
                .updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                })
                .defaultValue = JSON.stringify(runtime.getCurrentScript())

            form.addFieldGroup({
                id: "custpage_parametros",
                label: "Parametros"
            });

            const dtEmissaoRelatorioField = form.addField({
                id: "custpage_emit_report_date",
                label: "Data de Emissão do Relatório",
                type: serverWidget.FieldType.DATE,
                container: "custpage_parametros"
            });

            dtEmissaoRelatorioField.isMandatory = true;

            const naoExportarZerados = form.addField({
                id: "custpage_export_with_values",
                label: "Não exportar saldos zerados",
                type: serverWidget.FieldType.CHECKBOX,
                container: "custpage_parametros"
            });

            if (!dataDe && !dataAte) {

                form.updateDefaultValues({
                    custpage_emit_report_date: new Date(),
                });

                form.addButton({
                    id: "custpage_visualize",
                    label: "Processar",
                    functionName: "getAccBalance()"
                });

            } else {

                dataDeField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });

                dataAteField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });

                dtEmissaoRelatorioField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });

                naoExportarZerados.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });

                form.updateDefaultValues({
                    custpage_date_from: new Date(dataDe),
                    custpage_date_to: new Date(dataAte),
                    custpage_emit_report_date: new Date(dataRelatorio),
                    custpage_export_with_values: naoExportaContasZeradas === "true" ? "T" : "F"
                });

                const accSublist = form.addSublist({
                    id: "custpage_accounts",
                    label: "Contas",
                    type: serverWidget.SublistType.LIST
                });

                accSublist.addField({
                    id: "custpage_accountid",
                    label: "Conta",
                    type: serverWidget.FieldType.SELECT,
                    source: record.Type.ACCOUNT
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });

                accSublist.addField({
                    id: "custpage_accountnumber",
                    label: "Número Conta",
                    type: serverWidget.FieldType.TEXT,
                });

                accSublist.addField({
                    id: "custpage_reduced_account",
                    label: "Conta Reduzida",
                    type: serverWidget.FieldType.TEXT,
                });

                accSublist.addField({
                    id: "custpage_accountdescri",
                    label: "Descrição",
                    type: serverWidget.FieldType.TEXT,
                });

                accSublist.addField({
                    id: "custpage_debitsum",
                    label: "Soma Débito",
                    type: serverWidget.FieldType.CURRENCY,
                });

                accSublist.addField({
                    id: "custpage_creditsum",
                    label: "Soma Crédito",
                    type: serverWidget.FieldType.CURRENCY,
                });

                accSublist.addField({
                    id: "custpage_lan_colum",
                    label: "Coluna Lançamento",
                    type: serverWidget.FieldType.TEXT,
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY
                })

                const dataDeDefragment = defragmentDate(new Date(dataDe));
                const dataAteDefratgment = defragmentDate(new Date(dataAte));

                const accountBalanceArr = utilsMd.getAccountBalance(dataDeDefragment, dataAteDefratgment, naoExportaContasZeradas === "true");

                accountBalanceArr.forEach((result, index) => {

                    accSublist.setSublistValue({
                        id: "custpage_accountid",
                        value: result["accountId"],
                        line: index
                    });

                    accSublist.setSublistValue({
                        id: "custpage_accountnumber",
                        value: result["accountNumber"],
                        line: index
                    });

                    accSublist.setSublistValue({
                        id: "custpage_accountdescri",
                        value: result["accountDescription"],
                        line: index
                    });

                    accSublist.setSublistValue({
                        id: "custpage_reduced_account",
                        value: result["accountReduced"],
                        line: index
                    });

                    accSublist.setSublistValue({
                        id: "custpage_debitsum",
                        value: result["accountDebit"],
                        line: index
                    });

                    accSublist.setSublistValue({
                        id: "custpage_creditsum",
                        value: result["accountCredit"],
                        line: index
                    });

                    accSublist.setSublistValue({
                        id: "custpage_lan_colum",
                        value: getExportString(result, dataRelatorio),
                        line: index
                    });

                });

                form.addSubmitButton({
                    label: "Exportar"
                });

                form.addButton({
                    id: "custpage_visualize",
                    label: "Reprocessar",
                    functionName: "resetSL()"
                });

            }

            return form;

        }

        const createExportRecord = (parameters, request) => {

            const {
                custpage_date_from,
                custpage_date_to,
                custpage_emit_report_date,
                custpage_export_with_values
            } = parameters;

            const accLines = [];

            const requestLineCount = request.getLineCount({group: "custpage_accounts"});

            for (let index = 0; index < requestLineCount; index++) {

                accLines.push({
                    accountId: request.getSublistValue({
                        group: "custpage_accounts",
                        name: "custpage_accountid",
                        line: index
                    }),
                    accountNumber: request.getSublistValue({
                        group: "custpage_accounts",
                        name: "custpage_accountnumber",
                        line: index
                    }),
                    accountReduced: request.getSublistValue({
                        group: "custpage_accounts",
                        name: "custpage_reduced_account",
                        line: index
                    }),
                    accountDescription: request.getSublistValue({
                        group: "custpage_accounts",
                        name: "custpage_accountdescri",
                        line: index
                    }),
                    debitAmount: request.getSublistValue({
                        group: "custpage_accounts",
                        name: "custpage_debitsum",
                        line: index
                    }),
                    creditAmount: request.getSublistValue({
                        group: "custpage_accounts",
                        name: "custpage_creditsum",
                        line: index
                    }),
                    columnJournal: request.getSublistValue({
                        group: "custpage_accounts",
                        name: "custpage_lan_colum",
                        line: index
                    })
                });

            }

            if (accLines.length === 0) return false;

            const exportRecord = record.create({
                type: cts.CUSTOM_RECORD.REGISTRO_EXPORTACAO.ID,
                isDynamic: true
            });

            exportRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.REGISTRO_EXPORTACAO.FIELDS.DATA_DE,
                value: format.parse({
                    type: format.Type.DATE,
                    value: custpage_date_from
                })
            });

            exportRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.REGISTRO_EXPORTACAO.FIELDS.DATA_ATE,
                value: format.parse({
                    type: format.Type.DATE,
                    value: custpage_date_to
                })
            });

            exportRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.REGISTRO_EXPORTACAO.FIELDS.DATA_RELATORIO,
                value: format.parse({
                    type: format.Type.DATE,
                    value: custpage_emit_report_date
                })
            });

            exportRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.REGISTRO_EXPORTACAO.FIELDS.NAO_EXPORTAR_ZERADO,
                value: custpage_export_with_values === "T"
            });

            accLines.forEach((result) => {

                exportRecord.selectNewLine({
                    sublistId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.SUBLIST
                });

                exportRecord.setCurrentSublistValue({
                    sublistId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.SUBLIST,
                    fieldId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.FIELDS.CONTA,
                    value: result["accountId"]
                });

                exportRecord.setCurrentSublistValue({
                    sublistId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.SUBLIST,
                    fieldId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.FIELDS.NUMERO_CONTA,
                    value: result["accountNumber"]
                });

                exportRecord.setCurrentSublistValue({
                    sublistId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.SUBLIST,
                    fieldId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.FIELDS.DESCRICAO_CONTA,
                    value: result["accountDescription"]
                });

                exportRecord.setCurrentSublistValue({
                    sublistId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.SUBLIST,
                    fieldId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.FIELDS.CONTA_REDUZIDA,
                    value: result["accountReduced"]
                });

                exportRecord.setCurrentSublistValue({
                    sublistId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.SUBLIST,
                    fieldId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.FIELDS.VALOR_DEBITO,
                    value: result["debitAmount"]
                });

                exportRecord.setCurrentSublistValue({
                    sublistId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.SUBLIST,
                    fieldId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.FIELDS.VALOR_CREDITO,
                    value: result["creditAmount"]
                });

                exportRecord.setCurrentSublistValue({
                    sublistId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.SUBLIST,
                    fieldId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.FIELDS.COLUNA_LANCAMENTO,
                    value: result["columnJournal"]
                });

                exportRecord.commitLine({sublistId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.SUBLIST});

            });

            return exportRecord.save({ignoreMandatoryFields: true});

        }

        const defragmentDate = (dataObject) => {

            if (dataObject instanceof Date) {

                const day = dataObject.getDate();
                const month = dataObject.getMonth() + 1;

                return {
                    day: day < 10 ? '0' + day : day,
                    month: month < 10 ? '0' + month : month,
                    year: dataObject.getFullYear()
                }

            }

        }

        const getExportString = (result, parameterDate) => {

            let stringExport = "00092";

            const relatorioDate = new Date(parameterDate);
            const relatorioDateDefragment = defragmentDate(relatorioDate);
            const accountData = getStringAccount(result, result["accountReduced"]);

            stringExport += `${relatorioDateDefragment.day}${relatorioDateDefragment.month}${relatorioDateDefragment.year.toString()}00`;
            stringExport += `${accountData.contaCredito}001${accountData.contaDebito}001${accountData.valorAjustado}`;
            stringExport += `TRANSF FECHAMENTO                                 TRANSF FECHAMENTO                                 `;
            stringExport += `982                                        `;

            return stringExport;

        }

        const getStringAccount = (result, contaReduzida) => {

            const debitAmount = Number(result["accountDebit"]);
            const creditAmount = Number(result["accountCredit"]);

            let valorAjustado = 0;
            let [contaCredito, contaDebito] = ["4722", "4722"];

            if(creditAmount && debitAmount) {

                valorAjustado = creditAmount - debitAmount;

                if(creditAmount >= debitAmount) {
                    contaCredito = contaReduzida && contaReduzida != "- None -" ? contaReduzida : contaCredito;
                } else {
                    contaDebito = contaReduzida && contaReduzida != "- None -"  ? contaReduzida : contaDebito;
                }

            } else if(creditAmount && !debitAmount) {

                valorAjustado = creditAmount;
                contaCredito = contaReduzida && contaReduzida != "- None -" ? contaReduzida : contaCredito;

            } else if(!creditAmount && debitAmount) {

                valorAjustado = debitAmount;
                contaDebito = contaReduzida && contaReduzida != "- None -"  ? contaReduzida : contaDebito;
            }

            valorAjustado = "00000000000000000" + Math.abs(valorAjustado).toFixed(2).toString().replace(".", "");
            valorAjustado = valorAjustado.slice(-17);

            return {
                contaCredito: contaCredito,
                contaDebito: contaDebito,
                valorAjustado: valorAjustado
            }

        }


        return {onRequest}

    });
