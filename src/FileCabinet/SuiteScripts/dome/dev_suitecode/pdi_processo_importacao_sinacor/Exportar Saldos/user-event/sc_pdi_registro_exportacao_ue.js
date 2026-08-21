/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
        "N/record",
        "N/file",

        "../../modulos/sc_pdi_cts_md",
        "../../modulos/sc_pdi_utils_md"
    ],

    (record, file, cts, utilsMd) => {

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

            try {

                if (scriptContext.UserEventType.DELETE === scriptContext.type) return true;

                const configData = utilsMd.getConfigData();
                const newRecord = scriptContext.newRecord;

                const exportRecord = record.load({
                    type: newRecord.type,
                    id: newRecord.id,
                });

                let fileId = exportRecord.getValue({fieldId: cts.CUSTOM_RECORD.REGISTRO_EXPORTACAO.FIELDS.DOCUMENTO });
                fileId =  !fileId ? createFile(exportRecord, configData) : false;

                if(fileId) exportRecord.setValue({fieldId: cts.CUSTOM_RECORD.REGISTRO_EXPORTACAO.FIELDS.DOCUMENTO, value: fileId});

                exportRecord.save({ignoreMandatoryFields: true});

            } catch (e) {
                log.error({
                    title: "ERROR IN - afterSubmit",
                    details: e
                });
            }
        }

        const createFile = (exportRecord, configData) => {

            const accountDetail = []

            const detailLineCount = exportRecord.getLineCount({sublistId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.SUBLIST});

            for (let index = 0; index < detailLineCount; index++) {

                accountDetail.push({
                    columnJournal: exportRecord.getSublistValue({
                        sublistId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.SUBLIST,
                        fieldId: cts.CUSTOM_RECORD.DETALHE_EXPORTACAO.FIELDS.COLUNA_LANCAMENTO,
                        line: index
                    })
                });

            }

            if(accountDetail.length === 0) return false;

            let csvString = "";

            accountDetail.forEach((accountLine) => {
                csvString += `${accountLine["columnJournal"]}                                         \n`
            });

            if(csvString) return file.create({
                fileType: file.Type.PLAINTEXT,
                name: `EXP_${exportRecord.id}_${new Date().toISOString()}.txt`,
                contents: csvString,
                encoding: file.Encoding.UTF_8,
                folder: configData["pastaArquivoExportado"]
            }).save();

        }

        return {afterSubmit}

    });
