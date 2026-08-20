/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @author Dome Solutions - Mário Augusto
 * @description Espelho de ds-{prefixo}-get-data.js para escrita. Copie como está — só o nome
 * do arquivo leva o prefixo.
 */
define([], function () {

    function bodyFields(fields, targetRecord, data) {
        Object.keys(fields).forEach(function (fieldKey) {
            const field = fields[fieldKey];

            if (field.name === 'internalid') return;
            if (!Object.prototype.hasOwnProperty.call(data, fieldKey)) return;

            targetRecord.setValue({ fieldId: field.name, value: data[fieldKey] });
        });
    }

    function sublistFields(fields, targetRecord, sublistId, line, data) {
        Object.keys(fields).forEach(function (fieldKey) {
            const field = fields[fieldKey];

            if (!Object.prototype.hasOwnProperty.call(data, fieldKey)) return;

            targetRecord.setSublistValue({
                sublistId: sublistId,
                fieldId: field.name,
                line: line,
                value: data[fieldKey]
            });
        });
    }

    return {
        bodyFields: bodyFields,
        sublistFields: sublistFields
    };
});
