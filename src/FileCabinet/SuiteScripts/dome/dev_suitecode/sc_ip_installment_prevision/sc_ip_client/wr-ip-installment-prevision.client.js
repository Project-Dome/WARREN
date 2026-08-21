/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Gera/atualiza as linhas da sublista "Prestações Previsões"
 * a partir do campo custbody_wr_prevision_terms_ls no Pedido de Compra.
 */

define(['N/search', 'N/log', 'N/ui/dialog'], (search, log, dialog) => {

  // =========================
  // CONFIGURAÇÕES / CONSTANTES
  // =========================

  const BODY_FIELDS = {
    TERMS_BODY: 'custbody_wr_prevision_terms_ls', // "Prazo Previsões"
    PAYMENT_METHOD_BODY: 'custbody_pd_met_pagamento',
    TOTAL: 'total',
    TRANDATE: 'trandate',
    STATUS: 'status' // texto do status no formulário
  };

  // Sublista das previsões (customrecord_wr_installment_prevision)
  const SUBLIST_ID = 'recmachcustrecord_wr_ip_transaction_ls';

  const SUBLIST_FIELDS = {
    INSTALLMENT_NUMBER: 'custrecord_wr_ip_number_nu',
    DUE_DATE: 'custrecord_wr_ip_duedate_ts',
    BASE_AMOUNT: 'custrecord_wr_ip_base_amount_cr',
    PAYMENT_METHOD_RT: 'custrecord_wr_ip_pymtmethod_ls'
  };

  // Status que NÃO devem permitir recalcular (100% faturado / fechado)
  const BLOCKED_STATUS_TOKENS = [
    'fully billed',
    'billed',
    'totalmente faturado',
    'faturado',
    'closed',
    'fechado'
  ];

  // Modo atual da tela (create, edit, copy, view, etc.)
  let gMode = null;

  // ==============
  // FUNÇÕES ÚTEIS
  // ==============

  function addDays(date, days) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function addMonths(date, months) {
    const d = new Date(date.getTime());
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    // Ajuste para final de mês (31 -> último dia do mês seguinte se não existir)
    if (d.getDate() < day) {
      d.setDate(0);
    }
    return d;
  }

  function normalizeListValue(raw) {
    if (raw == null) return '';
    if (Array.isArray(raw) && raw.length > 0) {
      const v = raw[0];
      return (v.value || v.text || '').toString();
    }
    return raw.toString();
  }

  /**
   * Busca config do Term:
   * - recurrencecount
   * - recurrencefrequency
   * - dayofmonthnetdue
   * - installment (flag de parcelas)
   */
  function getTermConfig(termsId) {
    if (!termsId) {
      logDebug('getTermConfig - termsId vazio', {});
      return { count: 0, frequency: null, dayOfMonth: 0, isInstallment: false };
    }

    let data;
    try {
      data = search.lookupFields({
        type: search.Type.TERM,
        id: termsId,
        columns: ['recurrencecount', 'recurrencefrequency', 'dayofmonthnetdue', 'installment']
      });
    } catch (e) {
      logDebug('getTermConfig - erro lookupFields', { error: e.message || e });
      return { count: 0, frequency: null, dayOfMonth: 0, isInstallment: false };
    }

    const countRaw = data.recurrencecount;
    const freqRaw = data.recurrencefrequency;
    const dayRaw = data.dayofmonthnetdue;
    const installmentRaw = data.installment;

    const count = parseInt(countRaw, 10) || 0;
    const freqNorm = normalizeListValue(freqRaw).toUpperCase();
    const dayOfMonth = parseInt(dayRaw, 10) || 0;
    const isInstallment = (installmentRaw === true || installmentRaw === 'T');

    // Mapeia para códigos internos simples
    let freqCode = null;
    if (freqNorm.includes('DAY') || freqNorm.includes('DIA')) {
      freqCode = 'DAY';
    } else if (freqNorm.includes('WEEK') || freqNorm.includes('SEMAN')) {
      freqCode = 'WEEK';
    } else if (freqNorm.includes('MONTH') || freqNorm.includes('MENSAL')) {
      freqCode = 'MONTH';
    } else if (freqNorm.includes('YEAR') || freqNorm.includes('ANO')) {
      freqCode = 'YEAR';
    }

    logDebug('getTermConfig - resultado', {
      termsId,
      countRaw,
      freqRaw,
      dayRaw,
      installmentRaw,
      count,
      freqNorm,
      freqCode,
      dayOfMonth,
      isInstallment
    });

    return {
      count,
      frequency: freqCode,
      dayOfMonth,
      isInstallment
    };
  }

  function calcFirstDueDate(trandate, freqCode, dayOfMonth) {
    if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) {
      return trandate;
    }

    let candidate = new Date(trandate.getTime());
    candidate.setDate(dayOfMonth);

    if (candidate <= trandate) {
      if (freqCode === 'YEAR') {
        candidate = addMonths(candidate, 12);
      } else {
        candidate = addMonths(candidate, 1);
      }
    }

    return candidate;
  }

  function calcNthDue(firstDueDate, index, freqCode) {
    if (index === 0) {
      return firstDueDate;
    }

    if (!freqCode) {
      return addDays(firstDueDate, index * 30);
    }

    switch (freqCode) {
      case 'DAY':
        return addDays(firstDueDate, index);
      case 'WEEK':
        return addDays(firstDueDate, index * 7);
      case 'MONTH':
        return addMonths(firstDueDate, index);
      case 'YEAR':
        return addMonths(firstDueDate, index * 12);
      default:
        return addDays(firstDueDate, index * 30);
    }
  }

  function clearInstallmentLines(rec) {
    const lineCount = rec.getLineCount({ sublistId: SUBLIST_ID }) || 0;
    logDebug('clearInstallmentLines - antes', { lineCount });

    for (let i = lineCount - 1; i >= 0; i--) {
      rec.removeLine({
        sublistId: SUBLIST_ID,
        line: i,
        ignoreRecalc: true
      });
    }

    logDebug('clearInstallmentLines - depois', { removed: lineCount });
  }

  function buildInstallmentLines(rec, termsId) {
    const total = parseFloat(rec.getValue({ fieldId: BODY_FIELDS.TOTAL })) || 0;
    const trandate = rec.getValue({ fieldId: BODY_FIELDS.TRANDATE }) || new Date();
    const paymentMethod = rec.getValue({ fieldId: BODY_FIELDS.PAYMENT_METHOD_BODY });

    const cfg = getTermConfig(termsId);
    let { count, frequency, dayOfMonth, isInstallment } = cfg;

    logDebug('buildInstallmentLines - início', {
      total,
      trandate,
      paymentMethod,
      config: cfg
    });

    if (total <= 0) {
      logDebug('buildInstallmentLines - nada a gerar (total<=0)', {});
      return;
    }

    // Regra:
    // - Se NÃO for installment: uma única parcela
    // - Se for installment: usa recurrencecount (mínimo 1)
    let installmentCount;
    if (!isInstallment) {
      installmentCount = 1;
    } else {
      installmentCount = count || 1;
    }

    let remaining = total;
    const baseInstallment = Math.round((total / installmentCount) * 100) / 100;

    const firstDueDate = calcFirstDueDate(trandate, frequency, dayOfMonth);

    logDebug('buildInstallmentLines - cálculo base', {
      installmentCount,
      baseInstallment,
      remainingInicial: remaining,
      firstDueDate,
      frequency,
      dayOfMonth,
      isInstallment
    });

    for (let i = 1; i <= installmentCount; i++) {
      let amount = baseInstallment;
      if (i === installmentCount) {
        amount = Math.round(remaining * 100) / 100;
      }
      remaining -= amount;

      const index = i - 1;
      const dueDate = calcNthDue(firstDueDate, index, frequency);

      rec.selectNewLine({ sublistId: SUBLIST_ID });

      rec.setCurrentSublistValue({
        sublistId: SUBLIST_ID,
        fieldId: SUBLIST_FIELDS.INSTALLMENT_NUMBER,
        value: i
      });

      rec.setCurrentSublistValue({
        sublistId: SUBLIST_ID,
        fieldId: SUBLIST_FIELDS.BASE_AMOUNT,
        value: amount
      });

      rec.setCurrentSublistValue({
        sublistId: SUBLIST_ID,
        fieldId: SUBLIST_FIELDS.DUE_DATE,
        value: dueDate
      });

      if (paymentMethod) {
        rec.setCurrentSublistValue({
          sublistId: SUBLIST_ID,
          fieldId: SUBLIST_FIELDS.PAYMENT_METHOD_RT,
          value: paymentMethod
        });
      }

      rec.commitLine({ sublistId: SUBLIST_ID });

      logDebug('Parcela criada', {
        parcela: i,
        amount,
        dueDate,
        remainingDepois: remaining
      });
    }

    const finalCount = rec.getLineCount({ sublistId: SUBLIST_ID });
    logDebug('buildInstallmentLines - fim', {
      linhasGeradas: installmentCount,
      lineCountSublista: finalCount
    });
  }

  // ==============
  // EVENTOS
  // ==============

  function fieldChanged(context) {
    try {
      logDebug('fieldChanged', {
        fieldId: context.fieldId,
        sublistId: context.sublistId || '',
        line: context.line,
        mode: gMode
      });

      if (context.fieldId === BODY_FIELDS.TERMS_BODY) {
        onTermsChanged(context);
      }
    } catch (e) {
      logError('fieldChanged error', e);
    }
  }

  function onTermsChanged(context) {
    const rec = context.currentRecord;
    const termsId = rec.getValue({ fieldId: BODY_FIELDS.TERMS_BODY });
    const statusText = rec.getText({ fieldId: BODY_FIELDS.STATUS }) || '';

    logDebug('onTermsChanged - início', {
      termsId,
      statusText,
      mode: gMode
    });

    // Em EDIT/COPY, se o status indicar faturado/fechado, não recalcula e mostra popup
    if (gMode === 'edit' || gMode === 'copy') {
      if (statusText) {
        const lower = statusText.toLowerCase();
        const isBlocked = BLOCKED_STATUS_TOKENS.some(token =>
          lower.includes(token.toLowerCase())
        );

        if (isBlocked) {
          logDebug('onTermsChanged - status bloqueado, não recalcula', {
            statusText,
            blockedTokens: BLOCKED_STATUS_TOKENS
          });

          dialog.alert({
            title: 'Não é possível alterar o prazo de previsão',
            message:
              'Este Pedido de Compra está faturado/fechado. ' +
              'A alteração do prazo de previsão não irá recalcular as prestações. ' +
              'Caso seja necessário alterar as previsões, crie um novo pedido ou ajuste o status.'
          });

          return;
        }
      }
    }
    // Em CREATE, ou em EDIT/COPY com status não bloqueado → sempre recalcula

    clearInstallmentLines(rec);

    if (!termsId) {
      logDebug('onTermsChanged - terms vazio, só limpou linhas', {});
      return;
    }

    buildInstallmentLines(rec, termsId);
  }

  function pageInit(context) {
    gMode = context.mode; // 'create', 'edit', 'copy', 'view'...
    logDebug('pageInit', { mode: gMode });
  }

  // ==============
  // LOG HELPERS
  // ==============

  function logDebug(title, details) {
    try {
      log.audit({
        title: 'WR | ' + title,
        details: details
      });
    } catch (e) {/* ignore */}
    try {
      console.log('WR | ' + title, details);
    } catch (e) {/* ignore */}
  }

  function logError(title, error) {
    try {
      log.error({
        title: 'WR | ' + title,
        details: error
      });
    } catch (e) {/* ignore */}
    try {
      console.error('WR | ' + title, error);
    } catch (e) {/* ignore */}
  }

  return {
    fieldChanged,
    pageInit
  };
});
