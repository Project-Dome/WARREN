/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @author Dome Solutions - Mário Augusto
 * @description Lógica de negócio de regra de negocio do limite de 20% entre PO e Vendor Bill.
 */
define([
    './ds-mvb-vendorbill.service',
    './ds-mvb-purchase-order.service'
],

    function (
        vendorBillService,
        purchaseOrderService
    ) {
        const LIMIT_MULTIPLIER = 1.2;

        function buildGroups(vendorBillLines) {
            const groups = {};

            vendorBillLines.forEach(assignLineToGroup);

            return Object.keys(groups).map(toGroup);

            function assignLineToGroup(lineData) {
                const poId = lineData.createdFrom;
                if (!poId) return;

                if (!groups[poId]) groups[poId] = [];
                groups[poId].push(lineData);
            }

            function toGroup(poId) {
                return { poId: poId, lines: groups[poId] };
            }
        }

        function sumBillAmount(lines) {
            function addLineAmount(sum, lineData) {
                return sum + (Number(lineData.amount) || 0);
            }

            return lines.reduce(addLineAmount, 0);
        }

        function toViolation(group) {
            const billAmount = sumBillAmount(group.lines);
            const poAmount = purchaseOrderService.getTotal(group.poId);

            return { billAmount: billAmount, poAmount: poAmount };
        }

        function isViolation(group) {
            return group.billAmount > group.poAmount * LIMIT_MULTIPLIER;
        }

        function sumViolationField(violations, fieldKey) {
            function addField(sum, violation) {
                return sum + violation[fieldKey];
            }

            return violations.reduce(addField, 0);
        }

        function buildMessage(violations) {
            const totalAmount = sumViolationField(violations, 'billAmount');
            const totalPoAmount = sumViolationField(violations, 'poAmount');
            const originLabel = violations.length > 1 ? 'das POs de origem' : 'da PO de origem';

            return 'Não é possível salvar: o valor desta fatura (R$ ' + totalAmount.toFixed(2) +
                ') ultrapassa em mais de 20% o valor ' + originLabel + ' (R$ ' + totalPoAmount.toFixed(2) + ').';
        }

        function validate(vendorBillRecord) {
            const vendorBillLines = vendorBillService.getLines(vendorBillRecord);
            const groups = buildGroups(vendorBillLines);

            if (!groups.length) return { blocked: false, message: null };

            const mapAmount = groups.map(toViolation);
            const violations = mapAmount.filter(isViolation);

            log.audit({
                title: 'violations',
                details: violations
            })

            if (!violations.length)
                return { blocked: false, message: null };

            return { blocked: true, message: buildMessage(violations) };
        }

        return {
            validate: validate
        }
    }
);
