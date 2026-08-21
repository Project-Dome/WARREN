/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define([
        "N/format",
        "N/record",

        "../../modulos/sc_pdi_utils_md",
        "../../modulos/sc_pdi_cts_md"
    ],

    (format, record, utilsMd, cts) => {

        /**
         * Defines the function that is executed when a POST request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestBody) => {

            const {
                subsidiary,
                registroImportacao,
            } = requestBody;

            try {

                const currentRecord = record.load({
                    id: registroImportacao,
                    type: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.ID
                });

                const lineAgrouped = [];

                const detailLineCount = currentRecord.getLineCount({
                    sublistId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.SUBLIST
                });

                for (let index = 0; index < detailLineCount; index++) {

                    let referenceDate = currentRecord.getSublistValue({
                        sublistId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.SUBLIST,
                        fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.DATA_REFERENCIA,
                        line: index
                    }).toISOString();

                    let dateIndex = lineAgrouped.findIndex((arrObj) => arrObj.hasOwnProperty(referenceDate));

                    let journalNum = currentRecord.getSublistValue({
                        sublistId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.SUBLIST,
                        fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.NUMERO_LANCAMENTO,
                        line: index
                    });

                    let history = currentRecord.getSublistValue({
                        sublistId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.SUBLIST,
                        fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.HISTORICO,
                        line: index
                    });

                    const lineObj = {
                        acc: currentRecord.getSublistValue({
                            sublistId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.SUBLIST,
                            fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.CODIGO_FORMATADO_1, //TODO: Validar com o Filipe qual usar para saber a conta
                            line: index
                        }),
                        value: currentRecord.getSublistValue({
                            sublistId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.SUBLIST,
                            fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.VALOR_LANCAMENTO,
                            line: index
                        }),
                        type: currentRecord.getSublistValue({
                            sublistId: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.SUBLIST,
                            fieldId: cts.CUSTOM_RECORD.DETALHE_REGISTRO_IMPORTACAO.FIELDS.SINAL_LANCAMENTO,
                            line: index
                        }),
                        memo: `${journalNum} ${history}`
                    }

                    if (dateIndex === -1) {

                        const paramObj = {
                            [referenceDate]: [lineObj]
                        }

                        lineAgrouped.push(paramObj);

                        continue;
                    }

                    lineAgrouped[dateIndex][referenceDate].push(lineObj);

                }

                const allAccounts = utilsMd.getAllAccounts();

                utilsMd.updateImportRecordStatus({
                    importRecordId: registroImportacao,
                    statusField: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_PREVISAO,
                    status: cts.LIST.STATUS_IMPORTACAO.VALUES.EM_ANDAMENTO,
                });

                lineAgrouped.forEach((lineObj) => {

                    let lineObjKey = Object.keys(lineObj)[0];

                    let date = new Date(format.parse({
                        type: format.Type.DATE,
                        value: lineObjKey
                    }));

                    date = date.setHours(date.getHours() + (date.getTimezoneOffset() / 60));

                    date = new Date(date);

                    let creationParams = {
                        date: date,
                        dateString: lineObjKey,
                        subsidiary: subsidiary,
                        registroImportacao: registroImportacao,
                        allAccounts: allAccounts,
                        lineObj: lineObj[lineObjKey]
                    }

                    const previewTransactionId = utilsMd.createPreviewTransaction(creationParams);

                    log.audit({
                        title: "*** TRANSAÇÃO CRIADA ***",
                        details: `*** ID: ${previewTransactionId} ***`
                    });

                });

                const {previewStatus} = utilsMd.getImportRecordStatus(registroImportacao);

                if (previewStatus != cts.LIST.STATUS_IMPORTACAO.VALUES.ERRO) utilsMd.updateImportRecordStatus({
                    importRecordId: registroImportacao,
                    statusField: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_PREVISAO,
                    status: cts.LIST.STATUS_IMPORTACAO.VALUES.CONCLUIDO,
                });

            } catch (e) {

                utilsMd.updateImportRecordStatus({
                    importRecordId: registroImportacao,
                    statusField: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_PREVISAO,
                    status: cts.LIST.STATUS_IMPORTACAO.VALUES.ERRO,
                    errorMessage: e.message
                });
                log.error({
                    title: "ERROR IN - post",
                    details: e
                });
            }
        }

        return {post}

    });
