/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author ProjectDome
 * @description Model — customrecord_wr_installment_prevision (Previsão de Parcela).
 * Registro pré-existente no ambiente Warren, fora da ProjectDome — ver Docs/MANIFEST.md
 * para a definição completa dos campos. Este model cobre apenas as duas operações
 * necessárias ao entrypoint de cópia (Docs/TECH-SPEC.md, seção 1.1): buscar as previsões
 * de uma transação de origem e criar a cópia de uma previsão para outra transação. O
 * registro original nunca é editado por este model.
 */
define([
    'N/log',


    'N/record',
    '../../NetsuiteTools/pd_cnt_standard/pd-cnts-record.util',
    '../../NetsuiteTools/pd_cnt_standard/pd-cnts-search.util',
], function (log, record, record_util, search_util) {

    const TYPE = 'customrecord_wr_installment_prevision';

    const FIELDS = {
        internalId:    { name: 'internalid' },
        number:        { name: 'custrecord_wr_ip_number_nu', type: 'integer' },
        entity:        { name: 'custrecord_wr_ip_entity_ls', type: 'select' },
        baseAmount:    { name: 'custrecord_wr_ip_base_amount_cr', type: 'currency' },
        dueDate:       { name: 'custrecord_wr_ip_duedate_ts', type: 'date' },
        transaction:   { name: 'custrecord_wr_ip_transaction_ls', type: 'select' },
        paymentMethod: { name: 'custrecord_wr_ip_pymtmethod_ls', type: 'select' },
        observation:   { name: 'custrecord_wr_ip_obs_ds' },
    };

    /**
     * Busca todas as previsões de parcela vinculadas a uma transação de origem
     * (custrecord_wr_ip_transaction_ls). Usado tanto para ler as previsões do PO
     * de origem quanto, potencialmente, as de uma Vendor Bill.
     * @param {string|number} transactionId
     * @returns {Array<Object>}
     */
    function getByTransactionId(transactionId) {
        if (isNullOrEmpty(transactionId)) return [];

        return search_util.all({
            type: TYPE,
            columns: FIELDS,
            query: search_util.where(search_util.query(FIELDS.transaction, 'anyof', transactionId)),
        }) || [];
    }

    /**
     * Cria uma cópia de uma previsão de parcela de origem, apontando
     * custrecord_wr_ip_transaction_ls para a transação informada (a Vendor Bill
     * recém-criada) em vez da transação original (o PO). Os demais campos são
     * copiados como estão.
     * @param {Object} sourceRow linha retornada por getByTransactionId
     * @param {string|number} targetTransactionId
     * @returns {string} id do novo registro
     */
    function createCopy(sourceRow, targetTransactionId) {
        const newRecord = record.create({ type: TYPE });

        const fieldsToSet = {
            [FIELDS.number.name]:      sourceRow.number,
            [FIELDS.baseAmount.name]:  sourceRow.baseAmount,
            [FIELDS.dueDate.name]:     sourceRow.dueDate,
            [FIELDS.observation.name]: sourceRow.observation,
            [FIELDS.transaction.name]: { id: targetTransactionId },
        };

        if (!isNullOrEmpty(sourceRow.entity)) {
            fieldsToSet[FIELDS.entity.name] = { id: sourceRow.entity.id };
        }

        if (!isNullOrEmpty(sourceRow.paymentMethod)) {
            fieldsToSet[FIELDS.paymentMethod.name] = { id: sourceRow.paymentMethod.id };
        }

        const newId = record_util.handler(newRecord).set(fieldsToSet).save();

        log.audit({
            title: 'InstallmentPrevision.model | createCopy - success',
            details: JSON.stringify({ sourceId: sourceRow.internalId, newId, targetTransactionId }),
        });

        return newId;
    }

    return {
        TYPE,
        FIELDS,
        getByTransactionId,
        createCopy,
    };
});