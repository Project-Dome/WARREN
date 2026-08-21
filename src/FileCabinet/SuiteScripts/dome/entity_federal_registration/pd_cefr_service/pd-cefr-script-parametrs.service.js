/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Lucas Monaco
 */
define(
    [
        'N/runtime'
    ],
    function (
        runtime
    ) {
        function getCountryBrasil() {
            return runtime.getCurrentScript().getParameter({
                name: 'custscript_pd_cefr_brasil_country'
            });
        }

        return {
            getCountryBrasil: getCountryBrasil
        }
    }
)