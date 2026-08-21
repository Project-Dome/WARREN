/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define([
        "../../modulos/sc_pdi_utils_md",
        "../../modulos/sc_pdi_cts_md",
    ],

    (utilsMd, cts) => {

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

            try {

                utilsMd.updateImportRecordStatus({
                    importRecordId: requestBody,
                    statusField: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_LANCAMENTO,
                    status: cts.LIST.STATUS_IMPORTACAO.VALUES.EM_ANDAMENTO
                });

                utilsMd.getPreviewTransactionsList(requestBody).forEach((transactionId) => {

                    let journalId = utilsMd.createJournalTransaction(transactionId, requestBody);

                    log.audit({
                        title: "*** LANÇAMENTO CRIADO ***",
                        details: journalId
                    });

                });

                const {journalStatus} = utilsMd.getImportRecordStatus(requestBody);

                if (journalStatus != cts.LIST.STATUS_IMPORTACAO.VALUES.ERRO) utilsMd.updateImportRecordStatus({
                    importRecordId: requestBody,
                    statusField: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_LANCAMENTO,
                    status: cts.LIST.STATUS_IMPORTACAO.VALUES.CONCLUIDO
                });

            } catch (e) {

                utilsMd.updateImportRecordStatus({
                    importRecordId: requestBody,
                    statusField: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_LANCAMENTO,
                    status: cts.LIST.STATUS_IMPORTACAO.VALUES.ERRO,
                    errorMessage: e
                });

                log.error({
                    title: "ERROR IN - post",
                    details: e
                });
            }
        }


        return {post}

    });
