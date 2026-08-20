/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @author Dome Solutions - Mário Augusto
 * @description Leitura genérica de campos de um record já carregado, a partir do mapa
 * FIELDS de ds-{prefixo}-constants.js. Copie como está — só o nome do arquivo leva o prefixo.
 */
define([], function () {

    function bodyFields(fields, targetRecord) {
        const data = {};

        Object.keys(fields).forEach(function (fieldKey) {
            const field = fields[fieldKey];

            data[fieldKey] = field.name === 'internalid'
                ? targetRecord.id
                : targetRecord.getValue({ fieldId: field.name });
        });

        return data;
    }

    function sublistFields(fields, targetRecord, sublistId) {
        const lineCount = targetRecord.getLineCount({ sublistId: sublistId });
        const lines = [];

        for (let line = 0; line < lineCount; line++) {
            const lineData = {};

            Object.keys(fields).forEach(function (fieldKey) {
                const field = fields[fieldKey];

                lineData[fieldKey] = targetRecord.getSublistValue({
                    sublistId: sublistId,
                    fieldId: field.name,
                    line: line
                });
            });

            lines.push(lineData);
        }

        return lines;
    }

    function all(options) {
        const data = bodyFields(options.fields, options.record);

        Object.keys(options.sublists || {}).forEach(function (sublistName) {
            const sublist = options.sublists[sublistName];
            data[sublistName] = sublistFields(sublist.fields, options.record, sublist.sublistId);
        });

        return data;
    }

    return {
        bodyFields: bodyFields,
        sublistFields: sublistFields,
        all: all
    };
});
