/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Mario Augusto Braga Costa
 */
define(
    [
        'N/log',
        'N/ui/dialog',
        'pd/record',
        'pd/search'
    ],
    function (
        log,
        dialog,
        record_util,
        search_util
    ) {
        const TYPE = 'vendor';
        const FIELDS = {
            cnpj: { name: 'custentity_brl_entity_t_fed_tax_reg' },
            internacional: { name: 'custentity_brl_entity_t_int_tax_reg' },
            internalId: { name: 'internalid' },
        }

        function getByCnpjOrCpf(federalRegistration) {
            let entity = search_util.first({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.cnpj, "is", federalRegistration))
            });

            log.audit('getByCnpjOrCpf result', entity);

            return entity;
        }

        function getByInternational(international) {
            let entity = search_util.first({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.internacional, "is", international))
            });

            log.audit('getByInternational result', entity);

            return entity;
        }

        return {
            getByCnpjOrCpf: getByCnpjOrCpf,
            getByInternational: getByInternational
        };
    });
