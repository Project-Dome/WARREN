# TECH-SPEC — Cópia de Previsão de Parcelas na Vendor Bill (Warren)

## 1. Entrypoint: User Event — Vendor Bill (afterSubmit)

**Script:** `EntryPoints/InstallmentPrevisionCopy.UE.js` (`afterSubmit`)
→ `UseCases/CopyInstallmentPrevisions.js`
→ `Models/InstallmentPrevision.model.js`

**Registro de deployment:** `vendorbill` (nativo)

**Registro consultado/manipulado:** `customrecord_wr_installment_prevision` — objeto
pré-existente no ambiente Warren (fora da ProjectDome, sem cadastro prévio em MANIFEST).
Cadastrado no MANIFEST.md deste módulo como parte deste projeto, pois passa a ser
manipulado (criação de cópias) pelo novo entrypoint. Ver MANIFEST.md para a definição
completa dos campos.

### 1.1 Regra: Cópia das Previsões de Parcela do PO de origem

**Necessidade funcional:** ao criar uma Vendor Bill a partir de uma Purchase Order, cada
fatura precisa exibir sua própria cópia das previsões de parcela cadastradas no PO de
origem (`customrecord_wr_installment_prevision`), permitindo consulta e exibição
independente por fatura, sem alterar os registros originais vinculados ao PO.

**Contexto de execução:** roda apenas em `context.type === CREATE`. Ignorado em qualquer
outro evento (`EDIT`, `DELETE`, etc.).

**Identificação do PO de origem:** lida a partir do sublist nativo `purchaseorders` da
Vendor Bill recém-criada (campo `id` da primeira linha). Cenário observado sempre 1 PO por
fatura (sublist com uma única linha). O campo nativo `createdfrom` é usado apenas como
fallback defensivo, caso o sublist `purchaseorders` esteja vazio. Se nenhuma das duas
fontes apontar para uma Purchase Order, o script **não faz nada** (fatura sem PO de
origem, fora de escopo desta regra).

**Busca dos registros de origem:** todos os registros de `customrecord_wr_installment_prevision`
cujo campo `custrecord_wr_ip_transaction_ls` seja igual ao PO identificado. Se a busca não
retornar nenhum registro, o script não faz nada (sem erro).

**Cópia:** para cada registro de previsão encontrado, cria um **novo** registro
`customrecord_wr_installment_prevision`, copiando os campos:

| Campo (MANIFEST) | Tratamento na cópia |
|---|---|
| `custrecord_wr_ip_number_nu` | copiado como está |
| `custrecord_wr_ip_entity_ls` | copiado como está |
| `custrecord_wr_ip_base_amount_cr` | copiado como está |
| `custrecord_wr_ip_duedate_ts` | copiado como está |
| `custrecord_wr_ip_pymtmethod_ls` | copiado como está |
| `custrecord_wr_ip_obs_ds` | copiado como está |
| `custrecord_wr_ip_transaction_ls` | **não** copiado do original — na cópia, aponta para a Vendor Bill recém-criada (`context.newRecord.id`), não para o PO |

O registro original (que aponta para o PO) permanece intacto — nunca é editado nem
removido.

**Acúmulo em faturamento parcial:** um mesmo PO pode ser faturado em múltiplas Vendor Bills
ao longo do tempo (faturamento parcial). Cada nova Vendor Bill dispara sua própria cópia
completa de **todas** as previsões do PO de origem, sem checar se já foram copiadas por uma
fatura anterior — não há deduplicação. Comportamento intencional, confirmado pelo usuário:
cada fatura precisa exibir o registro de previsão, independentemente de quantas outras
faturas já tenham copiado o mesmo conjunto de previsões do PO.

**Tratamento de erro (best-effort por registro):** a cópia é feita registro a registro. Se a
criação de uma cópia específica falhar (ex.: erro de permissão, validação de campo), o
script registra o erro (`log.error`) identificando qual registro de previsão de origem
falhou, e **continua** tentando copiar os demais registros de previsão do mesmo PO. Uma
falha isolada não interrompe o processamento das demais cópias nem afeta a Vendor Bill já
salva (o `afterSubmit` roda após o commit da transação).

**Fora de escopo:**
- Vendor Bill originada de múltiplos POs simultaneamente (sublist nativo `purchaseorders`
  com mais de uma linha) — no fluxo atual do Warren, o sublist sempre tem uma única linha;
  múltiplos POs numa mesma fatura não são tratados por esta regra.
- Deduplicação de cópias entre faturamentos parciais do mesmo PO.
- Alteração do registro original de previsão (vinculado ao PO) — a cópia nunca escreve no
  registro de origem.
- Reprocessamento/backfill de Vendor Bills já criadas antes da entrada deste script em
  produção.