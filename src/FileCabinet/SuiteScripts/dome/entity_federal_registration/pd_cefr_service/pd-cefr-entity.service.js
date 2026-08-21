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
        'pd/search',

        '../pd_cefr_service/pd-cefr-script-parametrs.service',
        '../pd_cefr_service/pd-cefr-vendor.service',
    ],
    function (
        log,
        dialog,

        record_util,
        search_util,

        script_parameters,
        vendor_service

    ) {
        const TYPE = 'entity';
        const FIELDS = {
            cnpj: { name: 'custentity_brl_entity_t_fed_tax_reg' },
            internacional: { name: 'custentity_brl_entity_t_int_tax_reg' },
            country: { name: 'custentity_pd_cefr_country_customer' },
            internalId: { name: 'internalid' },
            type: { name: 'type' }
        }
        const ENTITY_TYPE_LIST = {
            custJob: "CustJob",
            vendor: "Vendor"
        }
        function manageDisabled(context) {
            const record = context.currentRecord;
            const fieldId = context.fieldId;
            if (fieldId === FIELDS.country.name) {
                const country = record.getValue({ fieldId: FIELDS.country.name });
                const brasilID = script_parameters.getCountryBrasil();
                const disableCNPJForBrasil = (country == brasilID);
                const mandatoryCNPJForBrasil = !(country == brasilID);
                const disableInternacionalForNonBrasil = !(country == brasilID);
                const mandatoryInternacionalForNonBrasil = (country == brasilID);
                record.getField({ fieldId: FIELDS.cnpj.name }).isDisabled = disableInternacionalForNonBrasil;
                record.getField({ fieldId: FIELDS.cnpj.name }).isMandatory = mandatoryInternacionalForNonBrasil;
                record.getField({ fieldId: FIELDS.internacional.name }).isDisabled = disableCNPJForBrasil;
                record.getField({ fieldId: FIELDS.internacional.name }).isMandatory = mandatoryCNPJForBrasil;
            }
            return true;
        }

        function manageFederalRegistrationForSavedRecord(context) {
            let _entityRecord = context.currentRecord;
            let _entityData = getBodyData({
                record: _entityRecord
            }).all();

            let _entityId = _entityRecord.id;
            let _country = _entityData.country;

            const _brasilId = script_parameters.getCountryBrasil();

            if (_country === _brasilId) {

                let _cnpjOrCpf = _entityData.cnpj;
                let _hasCnpj = !isNullOrEmpty(_cnpjOrCpf);

                if (!_hasCnpj) return true;
                let _entityDataBySearch = getByCnpjOrCpf(_cnpjOrCpf, _entityRecord.type);

                let _hasEntityDataBySearch = !isNullOrEmpty(_entityDataBySearch);
                let _isInvalidFederalRegistration = _hasEntityDataBySearch && _entityDataBySearch.internalId != _entityId;

                if (_isInvalidFederalRegistration) {
                    message({
                        for: _entityRecord.type,
                        currentCountry: _country,
                        brasilCountryId: _brasilId
                    });
                    return false;
                }
            } else {

                let _intlRegistration = _entityData.internacional;
                let _hasIntl = !isNullOrEmpty(_intlRegistration);

                if (!_hasIntl) return true;

                let _entityDataBySearch = getByInternational(_intlRegistration, _entityRecord.type);

                let _hasEntityDataBySearch = !isNullOrEmpty(_entityDataBySearch);
                let _isInvalidIntl = _hasEntityDataBySearch && _entityDataBySearch.internalId != _entityId;

                if (_isInvalidIntl) {
                    message({
                        for: _entityRecord.type,
                        currentCountry: _country,
                        brasilCountryId: _brasilId
                    });

                    return false;
                }
            }

            return true;
        }

        function manageFederalRegistration(context) {
            let _entityRecord = context.currentRecord;
            let _entityData = getBodyData({ record: _entityRecord }).all();
            let _entityId = _entityRecord.id;
            let _country = _entityData.country;
            let _fieldId = context.fieldId;

            const _brasilId = script_parameters.getCountryBrasil();

            if (_fieldId == FIELDS.cnpj.name && _country === _brasilId) {

                let _cnpj = _entityData.cnpj;
                let _hasCnpj = !isNullOrEmpty(_cnpj);

                if (!_hasCnpj) return true;

                let _entityDataBySearch = getByCnpjOrCpf(_cnpj, _entityRecord.type);
                let _hasEntityDataBySearch = !isNullOrEmpty(_entityDataBySearch);

                let _isInvalidFederalRegistration = _hasEntityDataBySearch && _entityDataBySearch.internalId != _entityId;

                if (_isInvalidFederalRegistration) {

                    message({
                        for: _entityRecord.type,
                        currentCountry: _country,
                        brasilCountryId: _brasilId
                    });

                    _entityRecord.setValue({ fieldId: FIELDS.cnpj.name, value: '', ignoreFieldChange: false });

                    return false;
                }
            }
            if (_fieldId == FIELDS.internacional.name && _country !== _brasilId) {

                let _intl = _entityData.internacional;
                let _hasIntl = !isNullOrEmpty(_intl);

                if (!_hasIntl) return true;

                let _entityDataBySearch = getByInternational(_intl, _entityRecord.type);
                let _hasEntityDataBySearch = !isNullOrEmpty(_entityDataBySearch);
                let _isInvalidIntl = _hasEntityDataBySearch && _entityDataBySearch.internalId != _entityId;

                if (_isInvalidIntl) {

                    message({
                        for: _entityRecord.type,
                        currentCountry: _country,
                        brasilCountryId: _brasilId
                    });

                    _entityRecord.setValue({ fieldId: FIELDS.internacional.name, value: '', ignoreFieldChange: false });

                    return false;
                }
            }

            return true;
        }

        function manageFederalRegistrationByServer(context) {
            let _entityRecord = context.newRecord;
            log.audit('_entityRecord', _entityRecord);

            let _entityData = getBodyData({ record: _entityRecord }).all();

            let _cnpj = _entityData.cnpj;
            let _hasCnpj = !isNullOrEmpty(_cnpj);

            if (!_hasCnpj) return;

            let _entityId = _entityRecord.id;
            let _entityDataBySearch = getByCnpjOrCpf(_cnpj, _entityRecord.type);
            let _hasEntityDataBySearch = !isNullOrEmpty(_entityDataBySearch);
            let _isInvalidFederalRegistration = _hasEntityDataBySearch && _entityDataBySearch.internalId != _entityId;

            if (_isInvalidFederalRegistration) {

                throw "Registro internacional inválido.";
            }
        }

        function manageInternationalRegistrationByServer(context) {
            let _entityRecord = context.newRecord;
            let _entityData = getBodyData({ record: _entityRecord }).all();

            let _entityId = _entityRecord.id;
            let _intl = _entityData?.internacional;
            let _hasIntl = !isNullOrEmpty(_intl);

            if (!_hasIntl) return;

            let _entityDataBySearch = getByInternational(_intl, _entityRecord.type);
            let _hasEntityDataBySearch = !isNullOrEmpty(_entityDataBySearch);
            let _isInvalidIntl = _hasEntityDataBySearch && _entityDataBySearch.internalId != _entityId;

            if (_isInvalidIntl) {

                throw "Registro internacional inválido.";
            }
        }

        function ifNullOrEmpty(value, defaultValue) {
            if (value === null || value === undefined || value === '') {
                return defaultValue;
            }

            return value;
        }

        function message(options) {

            let messageText = '';

            const isBrasil = options.currentCountry === options.brasilCountryId;

            const isVendor = (options.for).toUpperCase() == (ENTITY_TYPE_LIST.vendor).toUpperCase();

            if (isBrasil) {
                messageText = isVendor ? manageVendorMessage() : manageCustumerMessage();
            } else {
                messageText = isVendor ? manageInternationalVendorMessage() : manageInternationalCustomerMessage();
            }

            dialog.create({ title: "Atenção", message: messageText });
        }
        function manageVendorMessage() {
            return "CNPJ/CPF já está cadastrado em um Fornecedor. <br /> Por favor, insira um CNPJ/CPF não existente na base para seguir."
        }
        function manageCustumerMessage() {
            return "CNPJ/CPF já está cadastrado em um Cliente. <br /> Por favor, insira um CNPJ/CPF não existente na base para seguir."
        }
        function manageInternationalVendorMessage() {
            return "Registro Fiscal Internacional já está cadastrado em um Fornecedor. <br /> Por favor, insira um valor único para continuar.";
        }
        function manageInternationalCustomerMessage() {
            return "Registro Fiscal Internacional já está cadastrado em um Cliente. <br /> Por favor, insira um valor único para continuar.";
        }

        function getByCnpjOrCpf(federalRegistration, entityType) {
            let _manageFilterType = entityType == 'vendor' ? 'vendor' : [ENTITY_TYPE_LIST.custJob];

            if (_manageFilterType == 'vendor') return vendor_service.getByCnpjOrCpf(federalRegistration);

            let entity = search_util.first({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.type, "anyof", _manageFilterType))
                    .and(search_util.query(FIELDS.cnpj, "is", federalRegistration))
            });

            log.audit('entity', entity);

            return entity
        }

        function getByInternational(intlRegistration, entityType) {
            let _manageFilterType = entityType == 'vendor' ? 'vendor' : [ENTITY_TYPE_LIST.custJob];

            if (_manageFilterType == 'vendor') return vendor_service.getByInternational(intlRegistration);

            let internacionalData = search_util.first({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.type, "anyof", _manageFilterType))
                    .and(search_util.query(FIELDS.internacional, "is", intlRegistration))
            });

            log.audit('internacionalData', internacionalData);

            return internacionalData;
        }

        function getBodyData(options) {
            var _record = options.record;
            function getValue(params) {
                try {
                    return _record.getValue({ fieldId: params.fieldId });
                } catch (error) {
                    log.error('Erro ao obter valor', error);
                }
            }
            return {
                cnpj: function () {
                    return getValue({ fieldId: FIELDS.cnpj.name });
                },
                all: function () {
                    return {
                        cnpj: getValue({ fieldId: FIELDS.cnpj.name }),
                        internacional: getValue({ fieldId: FIELDS.internacional.name }),
                        country: getValue({ fieldId: FIELDS.country.name })
                    }
                }
            }
        }
        function isNullOrEmpty(value) {
            return value === null || value === undefined || value === '';
        }

        function manageFederalRegistrationPageInit(context) {
            const _brasilId = script_parameters.getCountryBrasil();
            let _country = context.currentRecord.getValue({ fieldId: 'custentity_pd_cefr_country_customer' });
            console.log(_country);
            
            let _internacionalField = context.currentRecord.getField({ fieldId: 'custentity_brl_entity_t_int_tax_reg' });
            let _federalField = context.currentRecord.getField({ fieldId: 'custentity_brl_entity_t_fed_tax_reg' });

            if (_country == _brasilId) {
                _internacionalField.isDisabled = true;
                _federalField.isDisabled = false;

                return true

            } else if (!isNullOrEmpty(_country) && _country != _brasilId) {
                _internacionalField.isDisabled = false;
                _federalField.isDisabled = true;

                return true
            }

            _internacionalField.isDisabled = true;
            _federalField.isDisabled = true;

            return true;
        }

        return {
            manageFederalRegistration: manageFederalRegistration,
            manageFederalRegistrationByServer: manageFederalRegistrationByServer,
            manageInternationalRegistrationByServer: manageInternationalRegistrationByServer,
            manageFederalRegistrationForSavedRecord: manageFederalRegistrationForSavedRecord,
            manageDisabled: manageDisabled,
            manageFederalRegistrationPageInit: manageFederalRegistrationPageInit
        }
    }
);