/**
* @NApiVersion 2.1
* @NScriptType UserEventScript
*/
define(['../models/wr_bill_installment_payment_sync_msr'],

    (msr) => {
        const beforeSubmit = (context) => {
            try {
                if (context.type !== context.UserEventType.CREATE) return;
                msr.process(context);
            } catch (error) {
                log.error('Error on beforeSubmit', error);
                throw error;
            }
        }

        return { beforeSubmit }
    }
);