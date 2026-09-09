# Project Manifest: pd_ipc — Cópia de Previsão de Parcelas na Vendor Bill

**Cliente:** Warren
**Gerado em:** 2026-08-24
**Gerado por:** manifest-builder

---

## Scripts

| Script ID | Arquivo | Tipo | Record Alvo | Descrição |
|---|---|---|---|---|
| `customscript_pd_ipc_vendor_bill_ue`* | `EntryPoints/InstallmentPrevisionCopy.UE.js` | UserEvent | `vendorbill` | Copia os registros de `customrecord_wr_installment_prevision` da(s) PO(s) de origem — identificada(s) pelo sublist nativo `purchaseorders` (campo `id`, todas as linhas), com `createdfrom` como fallback defensivo — para a Vendor Bill recém-criada, na criação da Vendor Bill |

> \* Script ID inferido a partir do nome do arquivo (script ainda não implementado nem deployado — fase de design). Confirmar/gerar o ID real no ambiente NetSuite na implementação.

Camadas internas do entrypoint (sem script ID próprio, apenas referência de arquivo): `UseCases/CopyInstallmentPrevisions.js`, `Models/InstallmentPrevision.model.js`.

---

## Custom Records

### `customrecord_wr_installment_prevision` — Previsão de Parcela

**Pré-existente** — registro criado fora da ProjectDome no ambiente Warren; sem internal ID numérico confirmado, apenas o script ID textual acima. Registrado neste MANIFEST porque o novo entrypoint passa a criar cópias deste registro. Campos levantados a partir do código-fonte legado do Warren (`dev_suitecode/sc_ip_installment_prevision/sc_ip_client/wr-ip-installment-prevision.client.js`) e confirmação do usuário.

| Campo | Internal ID | Tipo | Descrição |
|-------|-------------|------|-----------|
| Número da Parcela | `custrecord_wr_ip_number_nu` | Integer | Armazena o número sequencial da prestação |
| Entidade | `custrecord_wr_ip_entity_ls` | List/Record | Vincula a entidade relacionada à previsão |
| Valor | `custrecord_wr_ip_base_amount_cr` | Currency | Armazena o valor base da parcela |
| Vencimento | `custrecord_wr_ip_duedate_ts` | Date | Armazena a data de vencimento da parcela |
| Transação | `custrecord_wr_ip_transaction_ls` | List/Record | Vincula a transação relacionada — no registro original aponta para o PO; nas cópias geradas por este projeto, aponta para a Vendor Bill |
| Forma de Pagamento | `custrecord_wr_ip_pymtmethod_ls` | List/Record | Vincula a forma de pagamento da parcela |
| Observação | `custrecord_wr_ip_obs_ds` | Text | Armazena observação em texto livre |