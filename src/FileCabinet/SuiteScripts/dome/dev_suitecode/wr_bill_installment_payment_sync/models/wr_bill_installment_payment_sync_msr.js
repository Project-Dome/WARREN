/**
* @NApiVersion 2.1
*/
define(['N/runtime', '../modules/wr_bill_installment_payment_sync_cts'],
    (runtime, cts) => {

        const process = (context) => {
            try {
                log.debug('Start process')
                log.debug('Execution Context', runtime.executionContext);

                syncPaymentMethod(context.newRecord);

                log.debug('Finish process')
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
                for (let i = 0; i < lines; i++) {
                    const BillLinePaymentMethod = billRecord.getSublistValue({
                        sublistId: cts.TRANSACTION.SUBLISTS.INSTALLMENT.ID,
                        fieldId: cts.TRANSACTION.SUBLISTS.INSTALLMENT.FIELDS.PAYMENT_METHOD,
                        line: i
                    });

                    if (BillLinePaymentMethod != BillPaymentMethod) {
                        billRecord.setSublistValue({
                            sublistId: cts.TRANSACTION.SUBLISTS.INSTALLMENT.ID,
                            fieldId: cts.TRANSACTION.SUBLISTS.INSTALLMENT.FIELDS.PAYMENT_METHOD,
                            line: i,
                            value: BillPaymentMethod
                        });
                    }
                }
            } catch (error) {
                log.error('syncPaymentMethod error', error);
                throw error;
            }
        };

        return { process, syncPaymentMethod }
    });