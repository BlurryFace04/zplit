import type { Expense, Settlement, Member, Balance, DebtEdge } from '../types';

export function calculateBalances(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[]
): Balance[] {
  const balanceMap = new Map<string, number>();
  members.forEach((m) => balanceMap.set(m.id, 0));

  for (const expense of expenses) {
    const share = expense.amount / expense.splitAmong.length;
    const payer = balanceMap.get(expense.paidBy) ?? 0;
    balanceMap.set(expense.paidBy, payer + expense.amount);

    for (const memberId of expense.splitAmong) {
      const current = balanceMap.get(memberId) ?? 0;
      balanceMap.set(memberId, current - share);
    }
  }

  for (const settlement of settlements) {
    const from = balanceMap.get(settlement.fromMemberId) ?? 0;
    const to = balanceMap.get(settlement.toMemberId) ?? 0;
    balanceMap.set(settlement.fromMemberId, from + settlement.amount);
    balanceMap.set(settlement.toMemberId, to - settlement.amount);
  }

  return members.map((m) => ({
    memberId: m.id,
    memberName: m.name,
    amount: round(balanceMap.get(m.id) ?? 0),
  }));
}

export function simplifyDebts(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[]
): DebtEdge[] {
  const balances = calculateBalances(members, expenses, settlements);
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const b of balances) {
    if (b.amount > 0.00001) {
      creditors.push({ id: b.memberId, amount: b.amount });
    } else if (b.amount < -0.00001) {
      debtors.push({ id: b.memberId, amount: -b.amount });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const edges: DebtEdge[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const transfer = Math.min(debtors[i].amount, creditors[j].amount);
    if (transfer > 0.00001) {
      edges.push({
        from: debtors[i].id,
        fromName: memberMap.get(debtors[i].id) ?? '',
        to: creditors[j].id,
        toName: memberMap.get(creditors[j].id) ?? '',
        amount: round(transfer),
      });
    }
    debtors[i].amount -= transfer;
    creditors[j].amount -= transfer;
    if (debtors[i].amount < 0.00001) i++;
    if (creditors[j].amount < 0.00001) j++;
  }

  return edges;
}

function round(n: number): number {
  return Math.round(n * 100000000) / 100000000;
}
