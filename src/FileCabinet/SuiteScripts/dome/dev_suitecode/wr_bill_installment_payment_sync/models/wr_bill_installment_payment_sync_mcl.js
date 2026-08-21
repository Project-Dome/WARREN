/**
* @NApiVersion 2.1
*/
define(['../modules/wr_bill_installment_payment_sync_cts'],
    (cts) => {

        const process = (context) => {
            try {
                const { currentRecord, fieldId } = context;
                if (fieldId == cts.TRANSACTION.FIELDS.PAYMENT_METHOD) {
                    syncPaymentMethod(currentRecord);
                }
            } catch (error) {
                log.error('process error', error);
                throw error;
            }
        }

        const syncPaymentMethod = (billRecord) => {
            try {
                const BillPaymentMethod = billRecord.getValue(cts.TRANSACTION.FIELDS.PAYMENT_METHOD);
                log.debug('BillPaymentMethod', BillPaymentMethod)

                const lines = billRecord.getLineCount({ sublistId: cts.TRANSACTION.SUBLISTS.INSTALLMENT.ID });
                if (!lines || lines == 0) return
                log.debug('lines', lines)
                for (let i = 0; i < lines; i++) {
                    log.debug(i, BillPaymentMethod)
                    billRecord.selectLine({ sublistId: cts.TRANSACTION.SUBLISTS.INSTALLMENT.ID, line: i });

                    const BillLinePaymentMethod = billRecord.getCurrentSublistValue({
                        sublistId: cts.TRANSACTION.SUBLISTS.INSTALLMENT.ID,
                        fieldId: cts.TRANSACTION.SUBLISTS.INSTALLMENT.FIELDS.PAYMENT_METHOD,
                    });
                    log.debug('BillLinePaymentMethod', BillLinePaymentMethod)

                    if (BillLinePaymentMethod != BillPaymentMethod) {
                        billRecord.setCurrentSublistValue({
                            sublistId: cts.TRANSACTION.SUBLISTS.INSTALLMENT.ID,
                            fieldId: cts.TRANSACTION.SUBLISTS.INSTALLMENT.FIELDS.PAYMENT_METHOD,
                            value: BillPaymentMethod,
                        });
                        billRecord.commitLine({ sublistId: cts.TRANSACTION.SUBLISTS.INSTALLMENT.ID })
                    } else {
                        billRecord.cancelLine({ sublistId: cts.TRANSACTION.SUBLISTS.INSTALLMENT.ID })
                    }
                }
            } catch (error) {
                log.error('syncPaymentMethod error', error);
                throw error;
            }
        };

        const validateLine = (context) => {
            try {
                const { currentRecord, sublistId } = context;

                if (sublistId != cts.TRANSACTION.SUBLISTS.INSTALLMENT.ID) return;

                const billPaymentMethod = currentRecord.getValue({
                    fieldId: cts.TRANSACTION.FIELDS.PAYMENT_METHOD
                });

                log.debug('billPaymentMethod aqui', billPaymentMethod)
                const linePaymentMethod = currentRecord.getCurrentSublistValue({
                    sublistId,
                    fieldId: cts.TRANSACTION.SUBLISTS.INSTALLMENT.FIELDS.PAYMENT_METHOD
                });

                if (linePaymentMethod !== billPaymentMethod) {
                    currentRecord.setCurrentSublistValue({
                        sublistId,
                        fieldId: cts.TRANSACTION.SUBLISTS.INSTALLMENT.FIELDS.PAYMENT_METHOD,
                        value: billPaymentMethod,
                    });
                }
            } catch (error) {
                log.error('validateLine error', error);
                throw error;
            }
        };

        return { process, validateLine }
    });