/**
 * @NApiVersion 2.1
 */
define([
        "N/file",
        "N/record",
        "N/runtime",
        "N/search",
        "N/format",

        "../modulos/sc_pdi_cts_md"
    ],

    (file, record, runtime, search, format, cts) => {

        const handler = {}

        handler.createFile = (fileData) => {

            try {

                return file.create({
                    contents: fileData.getContents(),
                    fileType: fileData["fileType"],
                    name: fileData["name"],
                    folder: fileData["folder"],
                    encoding: file.Encoding.UTF_8
                }).save();

            } catch (e) {
                log.error({
                    title: "ERROR IN - createFile",
                    details: e
                });
            }

        }

        handler.transformInDate = (dateString) => {

            try {

                if (!dateString) return false;

                const year = parseInt(dateString.substring(0, 4));
                const month = parseInt(dateString.substring(4, 6)) - 1;
                const day = parseInt(dateString.substring(6));

                return new Date(year, month, day, 0, 0, 0, 0);

            } catch (e) {
                log.error({
                    title: "ERROR IN - transformInDate",
                    details: e
                });
            }
        }

        handler.createImportRecord = (fileId, subsidiaryId) => {

            try {

                const entityId = runtime.getCurrentUser().id;

                const importRecord = record.create({
                    type: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.ID,
                });

                importRecord.setValue({
                    fieldId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.USUARIO,
                    value: entityId
                });

                importRecord.setValue({
                    fieldId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.ARQUIVO_IMPORTADO,
                    value: fileId
                });

                importRecord.setValue({
                    fieldId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.SUBSIDIARIA,
                    value: subsidiaryId
                });

                importRecord.setValue({
                    fieldId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_INTEGRACAO,
                    value: cts.LIST.STATUS_IMPORTACAO.VALUES.PENDENTE
                });

                return importRecord.save({ignoreMandatoryFields: true});

            } catch (e) {
                log.error({
                    title: "ERROR IN - createImportRecord",
                    details: e
                });
            }
        }

        handler.createImportDetailRecord = (importRecordId, lineData) => {

            const importDetaiLRecord = record.create({
                type: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.ID
            });

            importDetaiLRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.REGISTRO_IMPORTACAO,
                value: importRecordId
            });

            importDetaiLRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.DATA_REFERENCIA,
                value: lineData["dataReferencia"]
            });

            importDetaiLRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.NUMERO_LANCAMENTO,
                value: lineData["numeroLancamento"]
            });

            importDetaiLRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.CODIGO_RESUMIDO_1,
                value: lineData["codigoResumido"]
            });

            importDetaiLRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.CODIGO_FORMATADO_1,
                value: lineData["codigoFormatado"].trimEnd()
            });

            importDetaiLRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.CODIGO_RESUMIDO_2,
                value: lineData["codigoResumido_segundo"]
            });

            importDetaiLRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.CODIGO_FORMATADO_2,
                value: lineData["codigoFormatado_segundo"].trimEnd()
            });

            importDetaiLRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.HISTORICO,
                value: lineData["historico"].trimEnd()
            });

            importDetaiLRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.SINAL_LANCAMENTO,
                value: lineData["sinalLancamento"]
            });

            importDetaiLRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.VALOR_LANCAMENTO,
                value: parseFloat(lineData["valorLancamento"]) / 100
            });

            importDetaiLRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.NUMERO_LOTE,
                value: lineData["numeroLote"]
            });

            importDetaiLRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.NUMERO_HISTORICO_CONTABIL,
                value: lineData["numeroHistoricoContabil"]
            });

            importDetaiLRecord.setValue({
                fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.DATA_LANCAMENTO,
                value: lineData["dataLancamento"]
            });

            return importDetaiLRecord.save({ignoreMandatoryFields: true});

        }

        handler.getConfigData = () => {

            try {

                const configRecordId = getFirstRecord(cts.CUSTOM_RECORD.CONFIGURACAO.ID);

                const configLookup = search.lookupFields({
                    type: cts.CUSTOM_RECORD.CONFIGURACAO.ID,
                    id: configRecordId,
                    columns: [
                        cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.PASTA_ARQUIVO_IMPORTADO,
                        cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.BTN_CRIAR_PREVIA,
                        cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.BTN_GERAR_LANCAMENTO,
                        cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.BTN_EXCLUIR_LANCAMENTO,
                        cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.BTN_REPROCESSAR_PREVIA,
                        cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.CONTA_PADRAO_ARRENDONDAMENTO,
                        cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.PASTA_ARQUIVO_EXPORTADO,
                        cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.COLUM_LANCAMENTO_PADRAO,
                    ]
                });

                return {
                    pastaArquivoImportado: configLookup[cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.PASTA_ARQUIVO_IMPORTADO],
                    btnCriarPrevia: extractMultiSelectValues(configLookup[cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.BTN_CRIAR_PREVIA]),
                    btnGerarLancamento: extractMultiSelectValues(configLookup[cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.BTN_GERAR_LANCAMENTO]),
                    btnExcluirLancamento: extractMultiSelectValues(configLookup[cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.BTN_EXCLUIR_LANCAMENTO]),
                    btnReprocessarPrevia: extractMultiSelectValues(configLookup[cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.BTN_REPROCESSAR_PREVIA]),
                    accDefaultRound: configLookup[cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.CONTA_PADRAO_ARRENDONDAMENTO][0]?.value,
                    pastaArquivoExportado: configLookup[cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.PASTA_ARQUIVO_EXPORTADO],
                    colunaLancamentoPadrao: configLookup[cts.CUSTOM_RECORD.CONFIGURACAO.FIELDS.COLUM_LANCAMENTO_PADRAO]
                }

            } catch (e) {
                log.error({
                    title: "ERROR IN - getConfigData",
                    details: e
                });

                return {}
            }
        }

        handler.setConfigData = (parameters) => {

            try {

                const configRecordId = getFirstRecord(cts.CUSTOM_RECORD.CONFIGURACAO.ID);

                if (!configRecordId) throw new Error("⚠️ Necessario criar uma instancia de configuração. ⚠️");

                record.submitFields({
                    type: cts.CUSTOM_RECORD.CONFIGURACAO.ID,
                    id: configRecordId,
                    values: {
                        "custrecord_pdi_config_default_folder_ds": parameters["custpage_arquivo_pasta_padrao"],
                        "custrecord_pdi_config_btn_preview_ms": parameters["custpage_btn_criar_previa"] ? parameters["custpage_btn_criar_previa"].replace(/\u0005/g, ',').split(',') : [],
                        "custrecord_pdi_config_btn_journal_ms": parameters["custpage_btn_gerar_lancamento"] ? parameters["custpage_btn_gerar_lancamento"].replace(/\u0005/g, ',').split(',') : [],
                        "custrecord_pdi_config_btn_del_journal_ms": parameters["custpage_btn_excluir_lancamento"] ? parameters["custpage_btn_excluir_lancamento"].replace(/\u0005/g, ',').split(',') : [],
                        "custrecord_pdi_config_reproc_preview_ms": parameters["custpage_btn_repro_previa"] ? parameters["custpage_btn_repro_previa"].replace(/\u0005/g, ',').split(',') : [],
                        "custrecord_pdi_config_stan_roun_acc_ls": parameters["custpage_round_acc"],
                        "custrecord_pdi_config_export_folder_ds": parameters["custpage_arquivo_exportado"],
                        "custrecord_pdi_config_default_column_ds": parameters["custpage_column_export"]
                    }
                });


            } catch (e) {
                log.error({
                    title: "ERROR IN - setConfigData",
                    details: e
                });
            }
        }

        handler.getAllAccounts = () => {

            try {

                const accountArr = [];

                const searchCreate = search.create({
                    type: search.Type.ACCOUNT,
                    columns: [
                        search.createColumn({
                            name: "number"
                        }),
                        search.createColumn({
                            name: "internalid"
                        }),
                    ]
                });

                const searchData = searchCreate.runPaged();
                searchData.pageRanges.forEach((pageRange) => {

                    let myPage = searchData.fetch({index: pageRange.index});

                    myPage.data.forEach((result) => {
                        accountArr.push({
                            id: result.getValue({name: "internalid"}),
                            accNumber: result.getValue({name: "number"}),
                        })
                    });

                });

                return accountArr;

            } catch (e) {
                log.error({
                    title: "ERROR IN - getAllAccounts",
                    details: e
                });
            }
        }

        handler.createPreviewTransaction = (creationParams) => {

            const {
                subsidiary,
                date,
                registroImportacao,
                lineObj,
                dateString,
                allAccounts,
                allAlocParam
            } = creationParams;

            const configData = handler.getConfigData();

            const previewTransaction = record.create({
                type: cts.CUSTOM_TRANSACTION.PREVIEW.ID,
                isDynamic: true
            });

            previewTransaction.setValue({
                fieldId: "subsidiary",
                value: subsidiary
            });

            previewTransaction.setValue({
                fieldId: "trandate",
                value: date
            });

            previewTransaction.setValue({
                fieldId: "memo",
                value: `${formatDateMemo(dateString)} - PREVIEW`
            });

            previewTransaction.setValue({
                fieldId: cts.CUSTOM_TRANSACTION.PREVIEW.FIELDS.REGISTRO_IMPORTACAO,
                value: registroImportacao
            });

            lineObj.forEach((line) => {

                const indexOfAlocParam = allAlocParam.findIndex((param) => param.accNumber === line["acc"]);

                if (indexOfAlocParam !== -1) {

                    const {
                        resultParam
                    } = allAlocParam[indexOfAlocParam];

                    resultParam.forEach((result) => {

                        const valuePercent = parseFloat(line["value"]) * (parseFloat(result["percent"]) / 100);

                        const param = {
                            memo: line["memo"],
                            allAccounts: allAccounts,
                            type: line["type"],
                            value: valuePercent >= 0.01 ? valuePercent.toFixed(2) : 0.01,
                            acc: line["acc"],
                            department: result["department"],
                            costCenter: result["costCenter"],
                            tranDescriptio: result["negociationDescription"],
                            percent: result["percent"],
                        }

                        createPreviewLine(previewTransaction, param);

                    });

                } else {

                    const param = {
                        memo: line["memo"],
                        allAccounts: allAccounts,
                        type: line["type"],
                        value: line["value"],
                        acc: line["acc"]
                    }

                    createPreviewLine(previewTransaction, param);
                }

            });

            createRoundLine(previewTransaction, configData);

            return previewTransaction.save({ignoreMandatoryFields: true});

        }

        handler.createJournalTransaction = (creationParams, importTransactionId) => {

            const previewTransaction = record.load({
                type: cts.CUSTOM_TRANSACTION.PREVIEW.ID,
                id: creationParams
            });

            const memoDate = previewTransaction.getValue({
                fieldId: "memo"
            }).split("-")[0];

            const journalTransaction = record.create({
                type: cts.CUSTOM_TRANSACTION.JOURNAL.ID,
                isDynamic: true
            });

            journalTransaction.setValue({
                fieldId: "subsidiary",
                value: previewTransaction.getValue({
                    fieldId: "subsidiary",
                })
            });

            journalTransaction.setValue({
                fieldId: "trandate",
                value: previewTransaction.getValue({
                    fieldId: "trandate",
                })
            });

            journalTransaction.setValue({
                fieldId: "memo",
                value: `${memoDate} - LANÇAMENTO DE RECEITA`,
            });

            journalTransaction.setValue({
                fieldId: cts.CUSTOM_TRANSACTION.JOURNAL.FIELDS.REGISTRO_IMPORTACAO,
                value: importTransactionId
            });

            journalTransaction.setValue({
                fieldId: cts.CUSTOM_TRANSACTION.JOURNAL.FIELDS.PREVIEW,
                value: creationParams
            });

            const linesCount = previewTransaction.getLineCount({
                sublistId: "line"
            });

            for (let index = 0; index < linesCount; index++) {

                journalTransaction.selectNewLine({
                    sublistId: "line"
                });

                journalTransaction.setCurrentSublistValue({
                    sublistId: "line",
                    fieldId: "memo",
                    value: previewTransaction.getSublistValue({
                        sublistId: "line",
                        fieldId: "memo",
                        line: index
                    })
                });

                journalTransaction.setCurrentSublistValue({
                    sublistId: "line",
                    fieldId: "account",
                    value: previewTransaction.getSublistValue({
                        sublistId: "line",
                        fieldId: "account",
                        line: index
                    })
                });

                const classId = previewTransaction.getSublistValue({
                    sublistId: "line",
                    fieldId: "class",
                    line: index
                });

                if(classId) journalTransaction.setCurrentSublistValue({
                    sublistId: "line",
                    fieldId: "class",
                    value: classId
                });

                const department = previewTransaction.getSublistValue({
                    sublistId: "line",
                    fieldId: "department",
                    line: index
                });

                if(department) journalTransaction.setCurrentSublistValue({
                    sublistId: "line",
                    fieldId: "department",
                    value: department
                });

                const description = previewTransaction.getSublistValue({
                    sublistId: "line",
                    fieldId: "custcol_sc_pdi_description_business",
                    line: index
                });

                if(description) journalTransaction.setCurrentSublistValue({
                    sublistId: "line",
                    fieldId: "custcol_sc_pdi_description_business",
                    value: description
                });

                const percent = previewTransaction.getSublistValue({
                    sublistId: "line",
                    fieldId: "custcol_sc_pdi_percentage",
                    line: index
                });

                if(percent) journalTransaction.setCurrentSublistValue({
                    sublistId: "line",
                    fieldId: "custcol_sc_pdi_percentage",
                    value: percent
                });

                let debit = previewTransaction.getSublistValue({
                    sublistId: "line",
                    fieldId: "debit",
                    line: index
                });

                let credit = previewTransaction.getSublistValue({
                    sublistId: "line",
                    fieldId: "credit",
                    line: index
                });

                if (debit) journalTransaction.setCurrentSublistValue({
                    sublistId: "line",
                    fieldId: "debit",
                    value: debit
                });

                if (credit) journalTransaction.setCurrentSublistValue({
                    sublistId: "line",
                    fieldId: "credit",
                    value: credit
                });

                journalTransaction.commitLine({sublistId: "line"});

            }

            return journalTransaction.save({ignoreMandatoryFields: true});
        }

        handler.getPreviewTransactionsList = (importTransaction) => {

            const transactionList = [];

            const searchCreate = search.create({
                type: cts.CUSTOM_TRANSACTION.PREVIEW.ID,
                filters: [
                    search.createFilter({
                        name: "mainline",
                        operator: search.Operator.IS,
                        values: true
                    }),
                    search.createFilter({
                        name: cts.CUSTOM_TRANSACTION.PREVIEW.FIELDS.REGISTRO_IMPORTACAO,
                        operator: search.Operator.ANYOF,
                        values: importTransaction
                    })
                ]
            });

            const searchData = searchCreate.runPaged();
            searchData.pageRanges.forEach((pageRange) => {

                let myPage = searchData.fetch({index: pageRange.index});

                myPage.data.forEach((result) => {
                    let transactionId = result.id;

                    if (!transactionList.includes(transactionId)) transactionList.push(transactionId);
                });

            });

            return transactionList;

        }

        handler.getJournalTransactionsList = (importTransaction) => {

            const transactionList = [];

            const searchCreate = search.create({
                type: cts.CUSTOM_TRANSACTION.JOURNAL.ID,
                filters: [
                    search.createFilter({
                        name: "mainline",
                        operator: search.Operator.IS,
                        values: true
                    }),
                    search.createFilter({
                        name: cts.CUSTOM_TRANSACTION.JOURNAL.FIELDS.REGISTRO_IMPORTACAO,
                        operator: search.Operator.ANYOF,
                        values: importTransaction
                    })
                ]
            });

            const searchData = searchCreate.runPaged();
            searchData.pageRanges.forEach((pageRange) => {

                let myPage = searchData.fetch({index: pageRange.index});

                myPage.data.forEach((result) => {
                    let transactionId = result.id;

                    if (!transactionList.includes(transactionId)) transactionList.push(transactionId);
                });

            });

            return transactionList;

        }

        handler.getLastImportRecordJournal = (subsidiaryId) => {

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
                            name: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_LANCAMENTO,
                            operator: search.Operator.ANYOF,
                            values: [cts.LIST.STATUS_IMPORTACAO.VALUES.CONCLUIDO, cts.LIST.STATUS_IMPORTACAO.VALUES.EXCLUIDO]
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
                log.error({
                    title: "ERROR IN - getLastImportRecord",
                    details: e
                });
            }
        }

        handler.updateImportRecordStatus = ({importRecordId, statusField, status, errorMessage}) => {

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

        handler.getImportRecordStatus = (importRecordId) => {

            try {

                const importRecordLookup = search.lookupFields({
                    type: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.ID,
                    id: importRecordId,
                    columns: [
                        cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_INTEGRACAO,
                        cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_PREVISAO,
                        cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_LANCAMENTO,
                        cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.SUBSIDIARIA,
                    ]
                });

                return {
                    importRecordStatus: importRecordLookup[cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_INTEGRACAO][0]?.value,
                    previewStatus: importRecordLookup[cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_PREVISAO][0]?.value,
                    journalStatus: importRecordLookup[cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_LANCAMENTO][0]?.value,
                    subsidiary: importRecordLookup[cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.SUBSIDIARIA][0]?.value
                }

            } catch (e) {
                log.error({
                    title: "ERROR IN - getImportRecordStatus",
                    details: e
                });
            }
        }

        handler.replacedImportRecord = (lastImportRecordId, newRecordImportId) => {

            try {

                const lastImportRecord = record.load({
                    type: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.ID,
                    id: lastImportRecordId
                });

                lastImportRecord.setValue({
                    fieldId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_INTEGRACAO,
                    value: cts.LIST.STATUS_IMPORTACAO.VALUES.SUBSTITUIDO
                });

                lastImportRecord.setValue({
                    fieldId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.NOVO_REGISTRO_IMPORTACAO,
                    value: newRecordImportId
                });

                return lastImportRecord.save({ignoreMandatoryFields: true});

            } catch (e) {
                log.debug({
                    title: "ERROR IN - "
                })
            }
        }

        handler.getReprocesDelete = () => {

            try {

                return search.create({
                    type: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.ID,
                    filters: [
                        search.createFilter({
                            name: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_LANCAMENTO,
                            operator: search.Operator.ANYOF,
                            values: cts.LIST.STATUS_IMPORTACAO.VALUES.CONCLUIDO
                        }),
                        search.createFilter({
                            name: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.NOVO_REGISTRO_IMPORTACAO,
                            operator: search.Operator.NONEOF,
                            values: "@NONE@"
                        })
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                        })
                    ]
                });

            } catch (e) {
                log.error({
                    title: "ERROR IN - getReprocesDelete",
                    details: e
                })
            }
        }

        handler.getDetailImportRecord = (importRecord) => {

            try {

                const detailLines = []

                const searchCreate = search.create({
                    type: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.ID,
                    filters: [
                        search.createFilter({
                            name: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.REGISTRO_IMPORTACAO,
                            operator: search.Operator.ANYOF,
                            values: importRecord
                        })
                    ],
                    columns: [
                        search.createColumn({
                            name: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.NUMERO_LANCAMENTO
                        }),
                        search.createColumn({
                            name: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.DATA_REFERENCIA
                        }),
                        search.createColumn({
                            name: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.HISTORICO
                        }),
                        search.createColumn({
                            name: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.CODIGO_FORMATADO_1
                        }),
                        search.createColumn({
                            name: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.VALOR_LANCAMENTO
                        }),
                        search.createColumn({
                            name: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.SINAL_LANCAMENTO
                        }),

                    ]
                });

                const searchData = searchCreate.runPaged();
                searchData.pageRanges.forEach((pageRange) => {

                    let myPage = searchData.fetch({index: pageRange.index});

                    myPage.data.forEach((result) => {
                        detailLines.push({
                            journalNum: result.getValue({name: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.NUMERO_LANCAMENTO}),
                            referenceDate: format.parse({
                                type: format.Type.DATE,
                                value: result.getValue({name: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.DATA_REFERENCIA})
                            }),
                            history: result.getValue({name: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.HISTORICO}),
                            acc: result.getValue({name: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.CODIGO_FORMATADO_1}),
                            valorLancamento: result.getValue({name: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.VALOR_LANCAMENTO}),
                            sinalLancamento: result.getValue({name: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.SINAL_LANCAMENTO}),
                        });
                    });

                });

                return detailLines;

            } catch (e) {
                log.error({
                    title: "ERROR IN - e",
                    details: e
                })
            }
        }

        handler.isValidAllocationParam = (paramRecord) => {

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

            }
        }

        handler.getAllLoctionParam = () => {

            try {

                const locationParamArr = [];

                const searchCreate = search.create({
                    type: cts.CUSTOM_RECORD.DETALHE_PARAMETRO_ALOCACAO.ID,
                    columns: [
                        search.createColumn({
                            name: cts.CUSTOM_RECORD.DETALHE_PARAMETRO_ALOCACAO.FIELDS.PORCENTAGEM
                        }),
                        search.createColumn({
                            name: cts.CUSTOM_RECORD.DETALHE_PARAMETRO_ALOCACAO.FIELDS.CENTRO_CUSTO
                        }),
                        search.createColumn({
                            name: cts.CUSTOM_RECORD.DETALHE_PARAMETRO_ALOCACAO.FIELDS.DEPARTAMENTO
                        }),
                        search.createColumn({
                            name: cts.CUSTOM_RECORD.DETALHE_PARAMETRO_ALOCACAO.FIELDS.DESCRICAO_NEGOCIACAO
                        }),
                        search.createColumn({
                            name: cts.CUSTOM_RECORD.PARAMETRO_ALOCACAO.FIELDS.NUMERO_CONTA_CONTABIL,
                            join: cts.CUSTOM_RECORD.DETALHE_PARAMETRO_ALOCACAO.FIELDS.CONTA_CONTABIL_ALOCACAO
                        }),
                    ]
                });

                const searchData = searchCreate.runPaged();
                searchData.pageRanges.forEach((pageRange) => {

                    let myPage = searchData.fetch({index: pageRange.index});

                    myPage.data.forEach((result) => {

                        const accNumber = result.getValue({
                            name: cts.CUSTOM_RECORD.PARAMETRO_ALOCACAO.FIELDS.NUMERO_CONTA_CONTABIL,
                            join: cts.CUSTOM_RECORD.DETALHE_PARAMETRO_ALOCACAO.FIELDS.CONTA_CONTABIL_ALOCACAO
                        });

                        const resultParam = {
                            percent: result.getValue({
                                name: cts.CUSTOM_RECORD.DETALHE_PARAMETRO_ALOCACAO.FIELDS.PORCENTAGEM
                            }),
                            costCenter: result.getValue({
                                name: cts.CUSTOM_RECORD.DETALHE_PARAMETRO_ALOCACAO.FIELDS.CENTRO_CUSTO
                            }),
                            department: result.getValue({
                                name: cts.CUSTOM_RECORD.DETALHE_PARAMETRO_ALOCACAO.FIELDS.DEPARTAMENTO
                            }),
                            negociationDescription: result.getValue({
                                name: cts.CUSTOM_RECORD.DETALHE_PARAMETRO_ALOCACAO.FIELDS.DESCRICAO_NEGOCIACAO
                            }),
                            accountText: accNumber
                        }

                        const indexOf = locationParamArr.findIndex((locationParam) => locationParam.accNumber == accNumber);

                        if (indexOf == -1) {
                            locationParamArr.push({
                                accNumber: accNumber,
                                resultParam: [resultParam]
                            });
                        } else {
                            locationParamArr[indexOf]["resultParam"].push(resultParam);
                        }


                    });

                });

                return locationParamArr;

            } catch (e) {
                log.debug({
                    title: "ERROR IN - searchAllLocationParam",
                    details: e
                });
            }
        }

        handler.deletePreviewTransaction = (importRecordId) => {
            const previewTranList = handler.getPreviewTransactionsList(importRecordId);

            previewTranList.forEach((tranId) => {

                record.delete({
                    type: cts.CUSTOM_TRANSACTION.PREVIEW.ID,
                    id: tranId
                });

                log.audit({
                    title: "*** REGISTRO APAGADO ***",
                    details: tranId
                });

            });
        }

        function getFirstRecord(recordType) {

            try {

                let recordId;

                search.create({
                    type: recordType,
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            sort: search.Sort.ASC
                        })
                    ]
                }).run().getRange({start: 0, end: 1}).forEach((result) => {
                    recordId = result.getValue({name: "internalid"});
                });

                return recordId;

            } catch (e) {
                log.error({
                    title: "ERROR IN - getFirstRecord",
                    details: e
                });

                return -1
            }
        }

        function formatDateMemo(dateString) {

            if (!dateString) return null;

            const year = dateString.substring(0, 4);
            const month = dateString.substring(5, 7);
            const day = dateString.substring(8, 10);

            return `${day}/${month}/${year}`

        }

        function extractMultiSelectValues(fieldArray) {
            try {
                if (fieldArray && Array.isArray(fieldArray)) {
                    return fieldArray.map(function (item) {
                        return item.value;
                    });
                }
                return [];
            } catch (e) {
                log.error({title: 'Erro ao obter os arrays do multiselect', details: e})
            }
        }

        function createPreviewLine(previewTransaction, {
            memo,
            allAccounts,
            type,
            value,
            acc,
            department,
            costCenter,
            tranDescriptio,
            percent,
            accId
        }) {

            previewTransaction.selectNewLine({
                sublistId: "line"
            });

            previewTransaction.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "memo",
                value: memo
            });

            let accountIndex = allAccounts.findIndex((accData) => accData.accNumber == acc);

            if (accountIndex === -1) log.error({
                title: "NÃO ACHOU CONTA",
                details: true
            });

            let accountId = allAccounts[accountIndex]?.id

            previewTransaction.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "account",
                value: accountId
            });

            if (department) previewTransaction.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "department",
                value: department
            });

            if (costCenter) previewTransaction.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "class",
                value: costCenter
            });

            if (tranDescriptio) previewTransaction.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "custcol_sc_pdi_description_business",
                value: tranDescriptio
            });

            if (percent) previewTransaction.setCurrentSublistValue({
                sublistId: "line",
                fieldId: "custcol_sc_pdi_percentage",
                value: parseFloat(percent)
            });

            let amountField;

            if (type === "D") amountField = "debit"

            if (type === "C") amountField = "credit"

            previewTransaction.setCurrentSublistValue({
                sublistId: "line",
                fieldId: amountField,
                value: value
            });

            previewTransaction.commitLine({sublistId: "line"});

        }

        function createRoundLine(previewTransaction, {accDefaultRound}) {

            const creditTotal = previewTransaction.getValue({fieldId: "credittotal"});
            const debitTotal = previewTransaction.getValue({fieldId: "debittotal"});

            if(creditTotal || debitTotal) {

                previewTransaction.selectNewLine({
                    sublistId: "line"
                });

                previewTransaction.setCurrentSublistValue({
                    sublistId: "line",
                    fieldId: "memo",
                    value: "Linha adicionada devido a arredondamento"
                });

                previewTransaction.setCurrentSublistValue({
                    sublistId: "line",
                    fieldId: "account",
                    value: accDefaultRound
                });

                if (creditTotal) previewTransaction.setCurrentSublistValue({
                    sublistId: "line",
                    fieldId: "debit",
                    value: creditTotal
                });

                if (debitTotal) previewTransaction.setCurrentSublistValue({
                    sublistId: "line",
                    fieldId: "credit",
                    value: debitTotal
                });

                previewTransaction.commitLine({sublistId: "line"});

            }

        }

        handler.getAccountBalance = (dataDeDefragment, dataAteDefratgment, naoExportaContasZeradas) => {

            log.debug({
                title: "naoExportaContasZeradas",
                details: naoExportaContasZeradas
            })

            const accountBalanceArr = []

            const searchCreate = search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    search.createFilter({
                        name: "posting",
                        operator: search.Operator.IS,
                        values: true
                    }),
                    search.createFilter({
                        name: "number",
                        join: "account",
                        operator: search.Operator.ISNOT,
                        values: ""
                    }),
                    search.createFilter({
                        name: "subsidiary",
                        operator: search.Operator.ANYOF,
                        values: [3,9,10,13,12]
                    }),
                    search.createFilter({
                        name: "type",
                        operator: search.Operator.NONEOF,
                        values: ["Custom119", "Custom120"]
                    })
                ],
                columns:   [
                    search.createColumn({
                        name: "account",
                        summary: "GROUP",
                    }),
                    search.createColumn({
                        name: "number",
                        join: "account",
                        summary: "GROUP",
                    }),
                    search.createColumn({
                        name: "description",
                        join: "account",
                        summary: "GROUP",
                    }),
                    search.createColumn({
                        name: "custrecord_reduced_account_wr",
                        join: "account",
                        summary: "GROUP",
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        summary: "SUM",
                        formula: `case when {trandate} >= to_date('${dataDeDefragment.day}/${dataDeDefragment.month}/${dataDeDefragment.year}', 'dd/mm/yyyy') and {trandate} <= to_date('${dataAteDefratgment.day}/${dataAteDefratgment.month}/${dataAteDefratgment.year}', 'dd/mm/yyyy') then {debitamount} else 0 end`,
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        summary: "SUM",
                        formula: `case when {trandate} >= to_date('${dataDeDefragment.day}/${dataDeDefragment.month}/${dataDeDefragment.year}','dd/mm/yyyy') and {trandate} <= to_date('${dataAteDefratgment.day}/${dataAteDefratgment.month}/${dataAteDefratgment.year}', 'dd/mm/yyyy') then {creditamount} else 0 end`
                    })
                ]
            });

            const searchData = searchCreate.runPaged();
            searchData.pageRanges.forEach((pageRange) => {

                let myPage = searchData.fetch({index: pageRange.index});

                myPage.data.forEach((result) => {

                    let resultJson = result.toJSON().values;

                    const debitAmount = Number(resultJson["SUM(formulanumeric)"]);
                    const creditAmount = Number(resultJson["SUM(formulanumeric)_1"]);

                    log.debug({
                        title: "debitAmount",
                        details: debitAmount,
                    })

                    log.debug({
                        title: "typeof debitAmount",
                        details: typeof debitAmount,
                    })

                    log.debug({
                        title: "creditAmount",
                        details: creditAmount,
                    })

                    log.debug({
                        title: "typeof creditAmount",
                        details: typeof creditAmount,
                    })


                    if(naoExportaContasZeradas && debitAmount === 0 && creditAmount == 0) return;

                    accountBalanceArr.push({
                        accountId: resultJson["GROUP(account)"][0]?.value,
                        accountDescription: resultJson["GROUP(account.description)"],
                        accountNumber: resultJson["GROUP(account.number)"],
                        accountReduced: resultJson["GROUP(account.custrecord_reduced_account_wr)"],
                        accountDebit: debitAmount.toFixed(2),
                        accountCredit: creditAmount.toFixed(2)
                    });

                });
            });

            return accountBalanceArr;

        }


        return handler;

    });
