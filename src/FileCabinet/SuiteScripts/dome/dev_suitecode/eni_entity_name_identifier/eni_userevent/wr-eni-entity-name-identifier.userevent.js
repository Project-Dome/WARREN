/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @author
 *   Project Dome / SuiteScript 2.1
 * @description
 *   After-submit (Customer & Vendor):
 *     - entityid = <custentity_brl_entity_t_fed_tax_reg> + " " + <companyname> (ou só companyname se não houver tax)
 *     - custentity_cst_nome_razao = <companyname>
 *   Observações:
 *     - Força o set dos dois campos em toda execução (evita casos em que não gravou antes).
 *     - Usa submitFields (não re-dispara o próprio UE).
 */

define(['N/record', 'N/log'], (record, log) => {
  const ENTITYID_MAXLEN = 83; // ajuste conforme necessário

  function _norm(s) {
    return (s || '').toString().replace(/\s+/g, ' ').trim();
  }

  function _buildEntityId(taxReg, company) {
    const left = _norm(taxReg);
    const right = _norm(company);
    const composed = left ? `${left} ${right}` : right;
    if (composed.length > ENTITYID_MAXLEN) {
      return composed.slice(0, ENTITYID_MAXLEN);
    }
    return composed;
  }

  function afterSubmit(context) {
    try {
      const newRec = context.newRecord;
      const recType = newRec.type; // record.Type.CUSTOMER or record.Type.VENDOR
      const recId   = newRec.id;

      if (recType !== record.Type.CUSTOMER && recType !== record.Type.VENDOR) {
        log.audit('Skip non-supported type', { recType, recId });
        return;
      }

      // Valores atuais
      const taxReg         = newRec.getValue({ fieldId: 'custentity_brl_entity_t_fed_tax_reg' });
      const companyname    = newRec.getValue({ fieldId: 'companyname' });
      const currentEntityId= newRec.getValue({ fieldId: 'entityid' });
      const currentNomeRaz = newRec.getValue({ fieldId: 'custentity_cst_nome_razao' });

      const desiredEntityId = _buildEntityId(taxReg, companyname);
      const desiredNomeRaz  = _norm(companyname);

      log.audit('AfterSubmit start', {
        contextType: context.type,
        recType,
        recId,
        inputs: {
          taxReg: _norm(taxReg),
          companyname: desiredNomeRaz
        },
        current: {
          entityid: _norm(currentEntityId),
          custentity_cst_nome_razao: _norm(currentNomeRaz)
        },
        desired: {
          entityid: desiredEntityId,
          custentity_cst_nome_razao: desiredNomeRaz
        }
      });

      if (!desiredNomeRaz) {
        log.audit('No-op: empty companyname', { recType, recId });
        return;
      }

      // Força o set dos dois campos sempre (garante atualização)
      const valuesToUpdate = {
        entityid: desiredEntityId,
        custentity_cst_nome_razao: desiredNomeRaz
      };

      record.submitFields({
        type: recType,
        id: recId,
        values: valuesToUpdate,
        options: { enableSourcing: false, ignoreMandatoryFields: true }
      });

      log.audit('AfterSubmit updated', {
        recType,
        recId,
        updated: valuesToUpdate
      });

    } catch (e) {
      log.audit('AfterSubmit error', {
        name: e.name || 'ERROR',
        message: e.message || e.toString(),
        stack: e.stack
      });
      // Não relança para não bloquear o salvamento do usuário
    }
  }

  return { afterSubmit };
});
