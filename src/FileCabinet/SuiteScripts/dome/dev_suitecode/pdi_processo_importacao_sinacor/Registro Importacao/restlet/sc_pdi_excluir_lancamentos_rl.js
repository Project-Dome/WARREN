/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define([
        "N/record",
        "N/scriptTypes/restlet",

        "../../modulos/sc_pdi_utils_md",
        "../../modulos/sc_pdi_cts_md",
    ],

    (record, restlet, utilsMd, cts) => {

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

            let sucess = false;

            try {

                utilsMd.getJournalTransactionsList(requestBody).forEach((transactionId) => {
                    const deletedTranId = record.delete({
                        id: transactionId,
                        type: cts.CUSTOM_TRANSACTION.JOURNAL.ID
                    });

                    if (deletedTranId) log.audit({
                        title: "*** REGISTRO EXCLUIDO ***",
                        details: deletedTranId
                    });
                });

                utilsMd.updateImportRecordStatus({
                    importRecordId: requestBody,
                    statusField: cts.CUSTOM_RECORD.REGISTRO_IMPORTACAO.FIELDS.STATUS_LANCAMENTO,
                    status: cts.LIST.STATUS_IMPORTACAO.VALUES.EXCLUIDO,
                });

                sucess = true;

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

            return restlet.createResponse({
                content: "OK",
                contentType: 'text/html'
            });

        }


        return {post}

    });
