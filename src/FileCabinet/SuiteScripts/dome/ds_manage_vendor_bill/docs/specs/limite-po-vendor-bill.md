# Especificação — Limite de 20% entre PO e Vendor Bill

## 1. Objetivo

Impedir a criação de um Vendor Bill cujo valor ultrapasse em mais de 20% o valor da(s) Purchase Order(s) (PO) de origem, via uma nova validação em SuiteScript que resolve o comportamento inconsistente do Workflow nativo hoje existente (trava não acionada em alguns cenários, acionada indevidamente em outros).

## 2. Arquitetura

- Implementação via **SuiteScript User Event** (`beforeSubmit`) — é a barreira de bloqueio absoluto, roda em **todos os contextos de execução** (UI, importação CSV, integrações via RESTlet/API, etc.), sem restrição por `N/runtime.executionContext`.
- **Client Script** (`saveRecord`) adicional, só na UI: chama o mesmo service de validação e exibe o erro antes do round-trip ao servidor, como feedback antecipado. Não substitui o User Event — se o Client Script falhar/for pulado por qualquer motivo, o User Event ainda bloqueia no servidor.
- Validação ocorre **apenas na criação** (`context.type === CREATE` no User Event) do Vendor Bill. Edições posteriores a um Vendor Bill já criado não são revalidadas (ver seção 9 — Fora de escopo).

## 3. Feedback ao usuário

Ao bloquear o save, o script lança um erro de validação (`N/error`) com uma das mensagens abaixo, dependendo de quantas POs de origem estão envolvidas no Vendor Bill:

- **Uma PO de origem:**
  > Não é possível salvar: o valor deste Vendor Bill (R$ {valor}) ultrapassa em mais de 20% o valor da PO de origem (R$ {limite}).

- **Mais de uma PO de origem:**
  > Não é possível salvar: o valor deste Vendor Bill (R$ {valor}) ultrapassa em mais de 20% o valor das POs de origem (R$ {limite}).

Onde `{valor}` é o valor do grupo de linhas do Bill vinculado à PO que ultrapassou o limite, e `{limite}` é 120% do valor total dessa PO. Se mais de um grupo ultrapassar o limite simultaneamente, o comportamento de exibição (uma mensagem por PO violada vs. mensagem única consolidada) fica a critério da implementação, desde que a pluralização siga a regra acima.

## 4. Critérios e regras de negócio

**Regra base:** Vendor Bill até 120% do valor total da respectiva PO de origem → permitir. Acima de 120% → bloquear.

**Cenários cobertos:**

1. **PO → Vendor Bill direto** (sem Item Receipt): validar o valor do Vendor Bill diretamente contra 120% do total da PO referenciada.
2. **PO → Item Receipt → Vendor Bill**: identificar a(s) PO(s) de origem percorrendo a cadeia de transações a partir do Item Receipt. Como um Item Receipt pode consolidar linhas de **múltiplas POs** (bulk receive), a validação deve:
   - Agrupar as linhas do Vendor Bill por PO de origem (rastreando linha a linha até a PO correspondente via a cadeia padrão de transações do NetSuite).
   - Somar o valor das linhas do Bill dentro de cada grupo.
   - Validar cada grupo isoladamente contra 120% do total da respectiva PO — **não** contra a soma de todas as POs envolvidas.

**Outras regras confirmadas:**

- O cálculo é sempre **individual por transação**: cada Vendor Bill é validado isoladamente no momento da criação. Não há acumulação entre múltiplos Vendor Bills vinculados à mesma PO ao longo do tempo.
- "Valor da PO" = **total da PO**, incluindo impostos e frete (não o subtotal de itens).
- Assume-se que PO e Vendor Bill estão sempre na **mesma moeda** — não há conversão cambial na validação.
- **Bloqueio absoluto**, sem exceção: nenhum papel (incluindo Administrator) pode ultrapassar o limite.
- Tentativas bloqueadas **não são registradas** em log/auditoria — apenas a mensagem de erro é exibida, sem persistência adicional.

## 5. Registros e campos envolvidos

Nenhum custom field ou custom record novo é necessário para esta feature. Utiliza apenas registros e campos padrão do NetSuite:

- `vendorbill` — total, linhas de item, cadeia de origem (`createdfrom`/campos de transação padrão).
- `itemreceipt` — linhas de item e sua PO de origem por linha (relevante no cenário de consolidação multi-PO).
- `purchaseorder` — total (com impostos/frete).

O mecanismo exato de rastreamento da cadeia de transações (nomes de campo/API a usar para localizar a PO de origem de cada linha) deve ser confirmado durante a implementação, inspecionando os registros reais na conta.

## 6. Contratos de scripts

**Módulo:** `ds_manage_vendor_bill` (projeto `ds_`, pasta raiz com o prefixo `ds_` + nome em snake_case; prefixo curto `mvb` — iniciais de "manage vendor bill" — usado nas subpastas `ds_mvb_{tipo}` e no scriptid, conforme convenção de `suitescript-scaffold`/`references/naming.md`).

**Nome dos entry points (User Event, Client Script):** `vendor-bill` — âncora só no record em
que o script é implantado (`<recordtype>` do deployment), sem sufixo de regra de negócio nem
menção a outros records que a lógica interna consulta (PO, Item Receipt). Convenção registrada em
`suitescript-scaffold/references/naming.md`.

**Service orquestrador:** `ds_mvb_service/ds-mvb-vendor-bill-limit.service.js` — mantém "limit" no
nome porque não é entry point vinculado a deployment; é o módulo que implementa especificamente a
regra do limite de 20%, distinto de `ds-mvb-vendorbill.service.js` (acesso a dados genérico de
Vendor Bill). Expõe `validate(vendorBillRecord)`, reaproveitado pelos dois entry points abaixo
(nenhuma lógica de negócio duplicada entre eles).

**Script 1 — User Event** (bloqueio absoluto, servidor):
- Pasta: `ds_mvb_userevent/`
- Arquivo: `ds-mvb-vendor-bill.userevent.js`
- Scriptid: `customscript_ds_mvb_vendor_bill_ue`
- Deployid: `customdeploy_ds_mvb_vendor_bill_ue`
- **Deployment:** record `vendorbill`, evento `beforeSubmit`, sem restrição de execution context.
- **Entrada:** o Vendor Bill sendo criado (`context.newRecord`), incluindo linhas de item e campo de origem (`createdfrom`).
- **Lógica:**
  1. Sair sem validar se `context.type !== CREATE`.
  2. Sair sem validar se o Vendor Bill não tiver origem em nenhuma PO (criado sem vínculo de compra — fora do escopo desta trava).
  3. Determinar o cenário: origem direta em PO, ou origem em Item Receipt (seguir a cadeia até a(s) PO(s)).
  4. Agrupar linhas do Bill por PO de origem identificada.
  5. Para cada grupo: comparar soma das linhas contra 120% do total da respectiva PO.
  6. Se qualquer grupo ultrapassar o limite, lançar erro (`N/error.create`) com a mensagem apropriada (seção 3), bloqueando o save.
  7. Se nenhum grupo ultrapassar, permitir o save normalmente.
- **Saída:** nenhuma alteração de dados — o script apenas valida e, se necessário, bloqueia via exceção.

**Script 2 — Client Script** (feedback antecipado, UI):
- Pasta: `ds_mvb_client/`
- Arquivo: `ds-mvb-vendor-bill.client.js`
- Scriptid: `customscript_ds_mvb_vendor_bill_cl`
- Deployid: `customdeploy_ds_mvb_vendor_bill_cl`
- **Deployment:** record `vendorbill`.
- **Entrada:** o Vendor Bill em edição na tela (`context.currentRecord`).
- **Lógica:** chama o mesmo `validate()` do service orquestrador; se `blocked`, exibe `N/ui/dialog.alert` com a mensagem da seção 3 e retorna `false` (impede o save); se a validação falhar de forma inesperada, loga o erro e retorna `true` (não bloqueia — o User Event é quem garante o bloqueio absoluto).
- **Saída:** nenhuma alteração de dados.

## 7. Permissões

Bloqueio absoluto para todos os papéis, incluindo Administrator. Não há papel com permissão de override/exceção.

## 8. Fora de escopo

- Revalidação em edições (`Edit`) de um Vendor Bill já criado — a trava atua apenas na criação.
- Qualquer papel ou mecanismo de override/bypass do limite de 120%.
- Conversão de moeda entre PO e Vendor Bill em moedas diferentes (assume-se sempre a mesma moeda).
- Log ou auditoria de tentativas bloqueadas.
- Validação equivalente no fluxo de vendas (Customer Invoice) — o módulo `ds_manage_vendor_bill` é escopado exclusivamente ao fluxo de compras (Vendor Bill); uma trava equivalente para Customer Invoice, se vier a existir, é um módulo `ds_` separado.
- Acumulação do limite entre múltiplos Vendor Bills vinculados à mesma PO ao longo do tempo (validação é sempre individual, por transação).

## 9. Notas de implementação

- O nome do módulo de script mudou de `vb-po-limit` para `vendor-bill-limit` e, na revisão
  seguinte, os **entry points** (User Event, Client Script) perderam também o `-limit`, ficando só
  `vendor-bill` — decisão do usuário: o nome de um entry point âncora **só** no record de
  **deployment** (Vendor Bill), nunca nos records que a lógica interna consulta (PO/Item Receipt)
  nem na regra de negócio específica. Regra geral registrada em `naming.md` das duas skills
  (`suitescript-scaffold`/`suitescript-scaffold-products`). Essa âncora vale apenas para entry
  points — o service orquestrador manteve `vendor-bill-limit` (ver seção 6), porque não é
  vinculado a deployment.
- O próprio módulo e o prefixo do projeto foram renomeados: `ds_manage_invoice`/`mg` →
  `ds_manage_vendor_bill`/`mvb`. Isso reverte a decisão original de manter o módulo genérico para
  acumular futuras features de Customer Invoice (ver seção 8, antiga nota removida) — o módulo
  passou a ser escopado só a Vendor Bill. Prefixo `mvb` = iniciais de "manage vendor bill",
  seguindo a regra (também registrada em `naming.md` das duas skills) de que o prefixo do projeto
  é sempre formado pelas iniciais das palavras do nome do módulo.
- Adicionado um **Client Script** (`saveRecord`) além do User Event planejado originalmente na
  seção 2 — mesma validação, chamando o mesmo service orquestrador, como feedback antecipado na
  UI. O User Event continua sendo a única barreira de bloqueio absoluto.

## Checklist de implementação

- [x] Parte 1 — Criar o script User Event (`ds-mvb-vendor-bill.userevent.js`) com a lógica de `beforeSubmit`, restrita a `context.type === CREATE`.
- [x] Parte 2 — Implementar a identificação da PO de origem para o cenário direto PO → Vendor Bill.
- [x] Parte 3 — Implementar a identificação da(s) PO(s) de origem para o cenário PO → Item Receipt → Vendor Bill, incluindo o agrupamento de linhas por PO quando o Item Receipt consolidar múltiplas POs.
- [x] Parte 4 — Implementar o cálculo do limite de 120% por grupo de PO e o bloqueio via erro de validação, com mensagem singular/plural conforme a quantidade de POs envolvidas.
- [x] Parte 5 — Criar o Object de deployment do script (`customscript_*.xml`) via SDF, restrito ao record Vendor Bill, sem restrição de contexto de execução.
- [ ] Parte 6 — Testar os dois cenários de aceite (PO → Vendor Bill direto e PO → Item Receipt → Vendor Bill, incluindo Item Receipt multi-PO) dentro e fora do limite de 120%.
- [x] Parte 7 — Criar o Client Script (`ds-mvb-vendor-bill.client.js`, `saveRecord`) reaproveitando o mesmo service, como feedback antecipado na UI.
