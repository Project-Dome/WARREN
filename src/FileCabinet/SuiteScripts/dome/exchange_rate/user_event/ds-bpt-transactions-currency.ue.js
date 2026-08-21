/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(["N/https", "N/record", "N/log"], function (https, record, log) {
  function beforeSubmit(context) {
    // Executa na criação e em qualquer edição subsequente da transação
    if (
      context.type !== context.UserEventType.CREATE &&
      context.type !== context.UserEventType.EDIT
    ) {
      return;
    }

    let transRecord = context.newRecord;
    let trandate  = transRecord.getValue('trandate');
    try {
      if (trandate) {
        // A referência de busca é sempre o último dia útil ANTERIOR ao trandate
        // (não o trandate em si) — ex.: trandate segunda 10/08 -> referência sexta 07/08.
        let trandateAsDate = new Date(trandate);
        trandateAsDate.setHours(0, 0, 0, 0);

        let searchDate = getLastBusinessDay(trandateAsDate);
        searchDate.setHours(0, 0, 0, 0);

        // Proteção contra data futura: a referência não pode ser posterior ao último
        // dia útil de hoje, já que a cotação PTAX de um dia futuro ainda não existe.
        let todayLastBusinessDay = getLastBusinessDay(new Date());
        todayLastBusinessDay.setHours(0, 0, 0, 0);

        if (searchDate > todayLastBusinessDay) {
          log.debug(
            "Data Futura Detectada",
            `Data ref (${formatFriendlyDate(searchDate)}) é posterior ao último dia útil de hoje. Limitando busca até ${formatFriendlyDate(todayLastBusinessDay)}.`,
          );
          searchDate = todayLastBusinessDay;
        }

        let ptaxRate = getLatestValidPtax(searchDate);

        log.debug('ptaxRate', ptaxRate);
        if (ptaxRate) {
          transRecord.setValue({
            fieldId: "exchangerate",
            value: ptaxRate,
          });

          log.debug(
            "Câmbio PTAX Atualizado",
            `Ref: ${formatFriendlyDate(searchDate)} | Taxa Aplicada: ${ptaxRate}`,
          );
        }
      }
    } catch (e) {
      log.error("Erro ao processar PTAX", e.message);
    }
  }

  /**
   * Retorna o último dia útil (seg-sex) anterior à data informada, pulando
   * sábados e domingos. Não considera feriados nacionais/municipais — não é
   * necessário aqui porque getLatestValidPtax já varre uma janela de 7 dias
   * e pega a cotação mais recente disponível dentro dela.
   */
  function getLastBusinessDay(referenceDate) {
    let date = new Date(referenceDate);
    date.setDate(date.getDate() - 1); // começa olhando o dia anterior

    while (date.getDay() === 0 || date.getDay() === 6) { // 0 = domingo, 6 = sábado
      date.setDate(date.getDate() - 1);
    }

    return date;
  }

  function getLatestValidPtax(targetDate) {
    let endDate = new Date(targetDate);
    let startDate = new Date(targetDate);

    startDate.setDate(startDate.getDate() - 7);

    let endStr = formatBCBDate(endDate);
    let startStr = formatBCBDate(startDate);

    log.debug('startStr', startStr);
    log.debug('endStr', endStr);

    let url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@dataInicial='${startStr}'&@dataFinalCotacao='${endStr}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json`;

    let response = https.get({ url: url });

    log.debug('response', response);
    if (response.code === 200) {
      let body = JSON.parse(response.body);
      if (body.value && body.value.length > 0) {
        return body.value[0].cotacaoVenda;
      }
    }
    return null;
  }

  function formatBCBDate(dateObj) {
    let dd = String(dateObj.getDate()).padStart(2, "0");
    let mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    let yyyy = dateObj.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }

  function formatFriendlyDate(dateObj) {
    let dd = String(dateObj.getDate()).padStart(2, "0");
    let mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    let yyyy = dateObj.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  function afterSubmit(context) {}

  return {
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});