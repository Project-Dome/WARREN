/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @author Dome Solutions - Mário Augusto
 * @description Busca via N/search mapeada pelas chaves do FIELDS de ds-{prefixo}-constants.js.
 * Copie como está — só o nome do arquivo leva o prefixo.
 */
define(['N/search'], function (search) {

    function toBoolean(value) {
        return value === true || value === 'T' || value === 'true';
    }

    function readRaw(field, result) {
        return result.getValue({ name: field.name, join: field.join, formula: field.formula });
    }

    function buildColumns(fields) {
        return Object.keys(fields)
            .filter(function (fieldKey) { return !fields[fieldKey].excludeFromSearch; })
            .map(function (fieldKey) {
                const field = fields[fieldKey];
                return search.createColumn({ name: field.name, join: field.join, formula: field.formula });
            });
    }

    function mapResult(fields, result) {
        const data = {};

        Object.keys(fields).forEach(function (fieldKey) {
            const field = fields[fieldKey];

            if (field.excludeFromSearch) return;

            if (field.name === 'internalid') {
                data[fieldKey] = result.id;
                return;
            }

            if (field.isCheckbox) {
                data[fieldKey] = toBoolean(readRaw(field, result));
                return;
            }

            if (field.isMultiSelect) {
                data[fieldKey] = String(readRaw(field, result) || '').split(',').filter(Boolean);
                return;
            }

            data[fieldKey] = field.isSelect
                ? {
                    value: readRaw(field, result),
                    text: result.getText({ name: field.name, join: field.join, formula: field.formula })
                }
                : readRaw(field, result);
        });

        return data;
    }

    function run(options) {
        const searchDefinition = search.create({
            type: options.type,
            filters: options.filters,
            columns: buildColumns(options.fields)
        });

        const results = [];

        searchDefinition.run().each(function (result) {
            results.push(mapResult(options.fields, result));
            return !options.max || results.length < options.max;
        });

        return results;
    }

    function first(options) {
        const results = run(Object.assign({}, options, { max: 1 }));
        return results.length ? results[0] : null;
    }

    return {
        run: run,
        first: first,
        buildColumns: buildColumns,
        mapResult: mapResult
    };
});
