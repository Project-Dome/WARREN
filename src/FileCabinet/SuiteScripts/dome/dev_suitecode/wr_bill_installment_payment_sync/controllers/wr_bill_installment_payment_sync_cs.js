/**
* @NApiVersion 2.1
* @NScriptType ClientScript
*/
define(['../models/wr_bill_installment_payment_sync_mcl'],

    (mcl) => {
        const fieldChanged = (context) => {
            try {
                mcl.process(context);
            } catch (error) {
                log.error('Error on fieldChanged ', error);
                throw error;
            }
        }

        const validateLine = (context) => {
            try {
                mcl.validateLine(context);
                return true;
            } catch (error) {
                log.error('Error on fieldChanged ', error);
                throw error;
            }
        }

        return { validateLine, fieldChanged }
    }
);