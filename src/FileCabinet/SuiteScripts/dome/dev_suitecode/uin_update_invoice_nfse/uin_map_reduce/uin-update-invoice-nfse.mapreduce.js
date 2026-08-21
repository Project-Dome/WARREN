/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 *
 * @description
 *  Atualiza em massa transações do tipo Invoice a partir de um arquivo CSV.
 *
 *  Regras:
 *   - CSV deve estar no File Cabinet, em uma pasta (ex.: 14886).
 *   - O script recebe via parâmetro o ID do arquivo CSV.
 *   - O CSV deve ter uma coluna chamada exatamente: "id interno"
 *   - Cada linha representa o internalid de uma Invoice.
 *
 *  Campos a serem atualizados na Invoice:
 *   - custbody_psg_ei_template       = "5"   (ID)
 *   - custbody_psg_ei_status         = "1"   (ID)
 *   - custbody_brl_tran_t_rps_series = "900" (lista - valor ID)
 *   - custbody_brl_tran_t_rps_num    = ""    (limpo)
 *
 *  IMPORTANTE:
 *   - Usa record.load() + record.save() para simular edição em tela,
 *     disparando User Events, Workflows, etc.
 */

define([
    'N/file',
    'N/log',
    'N/record',
    'N/runtime'
], (file, log, record, runtime) => {

    const CONFIG = {
        // Nome da coluna no cabeçalho do CSV
        CSV_COLUMN_INTERNAL_ID: 'id interno',

        // Valores padrão a serem aplicados
        DEFAULT_VALUES: {
            custbody_psg_ei_template: '5',
            custbody_psg_ei_status: '1',
            custbody_brl_tran_t_rps_series: '900',
            custbody_brl_tran_t_rps_num: null // null para limpar o campo
        },

        // Nome do parâmetro de script que recebe o ID do arquivo CSV
        PARAM_FILE_ID: 'custscript_uin_csv_update_invoice'
    };

    /**
     * Lê o arquivo CSV e devolve um array de objetos:
     * [{ invoiceId: '123', lineNumber: 2 }, ...]
     */
    const getInputData = () => {
        const script = runtime.getCurrentScript();
        const fileId = script.getParameter({ name: CONFIG.PARAM_FILE_ID });

        if (!fileId) {
            throw Error(`Parâmetro ${CONFIG.PARAM_FILE_ID} não informado. Configure o ID do arquivo CSV no deployment.`);
        }

        log.audit('getInputData', `Carregando arquivo CSV ID: ${fileId}`);

        const csvFile = file.load({ id: fileId });
        const content = csvFile.getContents();

        if (!content) {
            log.error('getInputData', 'Arquivo CSV vazio ou não lido corretamente.');
            return [];
        }

        // Quebra por linha (suporta \n ou \r\n)
        const lines = content.split(/\r?\n/).filter(l => l && l.trim().length > 0);

        if (lines.length <= 1) {
            log.error('getInputData', 'CSV contém apenas cabeçalho ou está sem linhas de dados.');
            return [];
        }

        const headerLine = lines[0];
        const delimiter = detectDelimiter(headerLine);

        const headerColumns = headerLine
            .split(delimiter)
            .map((h) => sanitizeHeader(h));

        const idxInternalId = headerColumns.indexOf(CONFIG.CSV_COLUMN_INTERNAL_ID.toLowerCase());

        if (idxInternalId === -1) {
            throw Error(`Coluna "${CONFIG.CSV_COLUMN_INTERNAL_ID}" não encontrada no cabeçalho do CSV.`);
        }

        const input = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line || !line.trim()) continue;

            const columns = line.split(delimiter);
            const invoiceIdRaw = (columns[idxInternalId] || '').trim();

            if (!invoiceIdRaw) {
                log.debug('Linha ignorada', `Linha ${i + 1} sem valor na coluna "${CONFIG.CSV_COLUMN_INTERNAL_ID}".`);
                continue;
            }

            const invoiceId = invoiceIdRaw.replace(/^"|"$/g, '').trim();

            if (!invoiceId) {
                log.debug('Linha ignorada', `Linha ${i + 1} com valor vazio após sanitização.`);
                continue;
            }

            input.push({
                invoiceId: invoiceId,
                lineNumber: i + 1
            });
        }

        log.audit('getInputData', `Total de linhas válidas com ID interno encontrado: ${input.length}`);
        return input;
    };

    /**
     * Detecta delimitador provável ( ; ou , )
     */
    const detectDelimiter = (headerLine) => {
        const countSemicolon = (headerLine.match(/;/g) || []).length;
        const countComma = (headerLine.match(/,/g) || []).length;

        if (countSemicolon >= countComma && countSemicolon > 0) {
            return ';';
        }
        if (countComma > 0) {
            return ',';
        }

        // Fallback: ponto e vírgula
        return ';';
    };

    /**
     * Limpa o header: tira aspas, trim, lowerCase
     */
    const sanitizeHeader = (value) => {
        return (value || '')
            .replace(/^"|"$/g, '')
            .trim()
            .toLowerCase();
    };

    /**
     * Map: carrega e atualiza cada Invoice individualmente
     */
    const map = (context) => {
        const value = JSON.parse(context.value);
        const invoiceId = value.invoiceId;
        const lineNumber = value.lineNumber;

        log.audit('map', `Processando Invoice ID: ${invoiceId} (linha CSV: ${lineNumber})`);

        try {
            // Carrega a Invoice como se estivesse editando em tela
            const invoiceRec = record.load({
                type: record.Type.INVOICE,
                id: invoiceId,
                isDynamic: false
            });

            // Aplica os valores
            invoiceRec.setValue({
                fieldId: 'custbody_psg_ei_template',
                value: CONFIG.DEFAULT_VALUES.custbody_psg_ei_template
            });

            invoiceRec.setValue({
                fieldId: 'custbody_psg_ei_status',
                value: CONFIG.DEFAULT_VALUES.custbody_psg_ei_status
            });

            invoiceRec.setValue({
                fieldId: 'custbody_brl_tran_t_rps_series',
                value: CONFIG.DEFAULT_VALUES.custbody_brl_tran_t_rps_series
            });

            // Limpa o campo de número de RPS
            invoiceRec.setValue({
                fieldId: 'custbody_brl_tran_t_rps_num',
                value: CONFIG.DEFAULT_VALUES.custbody_brl_tran_t_rps_num
            });

            const savedId = invoiceRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });

            log.audit('map', `Invoice ${invoiceId} atualizada com sucesso. SavedId: ${savedId}`);

            // Opcional: mandar info pro summarize via context.write
            context.write({
                key: 'success',
                value: {
                    invoiceId: invoiceId,
                    lineNumber: lineNumber
                }
            });

        } catch (e) {
            log.error('Erro ao processar Invoice', {
                invoiceId: invoiceId,
                lineNumber: lineNumber,
                message: e.message,
                stack: e.stack
            });

            context.write({
                key: 'error',
                value: {
                    invoiceId: invoiceId,
                    lineNumber: lineNumber,
                    message: e.message
                }
            });
        }
    };

    /**
     * summarize: loga um resumo da execução
     */
    const summarize = (summary) => {
        let successCount = 0;
        let errorCount = 0;

        summary.output.iterator().each((key, valueStr) => {
            const value = JSON.parse(valueStr);
            if (key === 'success') {
                successCount++;
            } else if (key === 'error') {
                errorCount++;
            }
            return true;
        });

        if (summary.inputSummary.error) {
            log.error('Erro em inputSummary', summary.inputSummary.error);
        }

        summary.mapSummary.errors.iterator().each((key, error) => {
            log.error('Erro em map', `Key: ${key} | Error: ${error}`);
            return true;
        });

        log.audit('summarize', `Concluído. Sucesso: ${successCount} | Erros: ${errorCount}`);
    };

    return {
        getInputData,
        map,
        summarize
    };
});
