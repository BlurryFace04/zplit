import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { calculateBalances, simplifyDebts } from '../utils/balance';
import { formatZec } from '../utils/format';
import { EmptyState } from '../components/EmptyState';

export function Dashboard() {
  const { groups, expenses, settlements, userName } = useStore();

  let youAreOwed = 0;
  let youOwe = 0;

  for (const group of groups) {
    const groupExpenses = expenses.filter((e) => e.groupId === group.id);
    const groupSettlements = settlements.filter((s) => s.groupId === group.id);
    const balances = calculateBalances(group.members, groupExpenses, groupSettlements);
    const myBalance = balances.find((b) => b.memberId === group.myMemberId);
    if (myBalance) {
      if (myBalance.amount > 0) youAreOwed += myBalance.amount;
      else youOwe += Math.abs(myBalance.amount);
    }
  }

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-lg mx-auto">
      <div className="px-4 pt-4 pb-4">
        {userName && (
          <p className="text-sm text-text-secondary mb-4">Hey, {userName}</p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-text-secondary mb-1">You are owed</p>
            <p className="text-lg font-bold text-positive">{formatZec(youAreOwed)}</p>
          </div>
          <div className="bg-bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-text-secondary mb-1">You owe</p>
            <p className="text-lg font-bold text-negative">{formatZec(youOwe)}</p>
          </div>
        </div>

        {groups.length === 0 ? (
          <EmptyState
            icon="⚡"
            title="No groups yet"
            description="Create a new group or join one with an invite code"
            action={
              <div className="flex gap-3">
                <Link
                  to="/join"
                  className="bg-bg-card text-text-primary border border-border font-semibold px-5 py-2.5 rounded-xl text-sm hover:border-zec-gold/40 hover:bg-bg-card-hover transition-colors"
                >
                  Join Group
                </Link>
                <Link
                  to="/groups/new"
                  className="bg-zec-gold text-bg-primary font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-zec-gold-dim transition-colors"
                >
                  Create Group
                </Link>
              </div>
            }
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                Your Groups
              </h2>
              <Link to="/groups" className="text-xs text-zec-gold font-medium">
                See all
              </Link>
            </div>
            <div className="space-y-2 mb-6">
              {groups.slice(0, 3).map((group) => {
                const groupExpenses = expenses.filter((e) => e.groupId === group.id);
                const groupSettlements = settlements.filter((s) => s.groupId === group.id);
                const debts = simplifyDebts(group.members, groupExpenses, groupSettlements);
                const totalMoving = debts.reduce((s, d) => s + d.amount, 0);

                return (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="flex items-center gap-3 bg-bg-card hover:bg-bg-card-hover rounded-2xl p-4 border border-border transition-colors"
                  >
                    <span className="text-2xl">{group.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{group.name}</p>
                      <p className="text-xs text-text-secondary">
                        {group.members.length} members &middot; {groupExpenses.length} expenses
                      </p>
                    </div>
                    {totalMoving > 0 && (
                      <p className="text-xs font-medium text-zec-gold">{formatZec(totalMoving)}</p>
                    )}
                  </Link>
                );
              })}
            </div>

            {recentExpenses.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Recent Expenses
                </h2>
                <div className="space-y-2">
                  {recentExpenses.map((expense) => {
                    const group = groups.find((g) => g.id === expense.groupId);
                    const payer = group?.members.find((m) => m.id === expense.paidBy);
                    const payerLabel =
                      group && expense.paidBy === group.myMemberId
                        ? 'You'
                        : payer?.name ?? 'Someone';
                    return (
                      <Link
                        key={expense.id}
                        to={`/groups/${expense.groupId}`}
                        className="flex items-center gap-3 bg-bg-card hover:bg-bg-card-hover rounded-2xl p-3 border border-border transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-zec-gold/10 flex items-center justify-center text-sm">
                          {group?.emoji ?? '💰'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{expense.description}</p>
                          <p className="text-xs text-text-secondary">{payerLabel} paid</p>
                        </div>
                        <p className="text-sm font-semibold text-zec-gold">
                          {formatZec(expense.amount)}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
