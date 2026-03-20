import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { formatZec, formatDate } from '../utils/format';
import { PageHeader } from '../components/PageHeader';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';

interface ActivityItem {
  id: string;
  type: 'expense' | 'settlement';
  groupId: string;
  description: string;
  amount: number;
  actorName: string;
  actorId: string;
  date: string;
  groupName: string;
  groupEmoji: string;
}

export function Activity() {
  const { groups, expenses, settlements } = useStore();

  const items: ActivityItem[] = [];

  const memberLabel = (groupId: string, memberId: string, name: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group && memberId === group.myMemberId ? 'You' : name;
  };

  for (const expense of expenses) {
    const group = groups.find((g) => g.id === expense.groupId);
    if (!group) continue;
    const payer = group.members.find((m) => m.id === expense.paidBy);
    items.push({
      id: expense.id,
      type: 'expense',
      groupId: expense.groupId,
      description: expense.description,
      amount: expense.amount,
      actorName: payer?.name ?? 'Unknown',
      actorId: expense.paidBy,
      date: expense.createdAt,
      groupName: group.name,
      groupEmoji: group.emoji,
    });
  }

  for (const settlement of settlements) {
    const group = groups.find((g) => g.id === settlement.groupId);
    if (!group) continue;
    const from = group.members.find((m) => m.id === settlement.fromMemberId);
    const to = group.members.find((m) => m.id === settlement.toMemberId);
    const fromLabel = memberLabel(settlement.groupId, settlement.fromMemberId, from?.name ?? '?');
    const toLabel = memberLabel(settlement.groupId, settlement.toMemberId, to?.name ?? '?');
    items.push({
      id: settlement.id,
      type: 'settlement',
      groupId: settlement.groupId,
      description: `${fromLabel} paid ${toLabel}`,
      amount: settlement.amount,
      actorName: from?.name ?? 'Unknown',
      actorId: settlement.fromMemberId,
      date: settlement.createdAt,
      groupName: group.name,
      groupEmoji: group.emoji,
    });
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Activity" />
      <div className="px-4 py-4">
        {items.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No activity yet"
            description="Expenses and settlements will appear here"
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const group = groups.find((g) => g.id === item.groupId);
              const actorLabel = group && item.actorId === group.myMemberId ? 'You' : item.actorName;
              return (
                <Link
                  key={item.id}
                  to={`/groups/${item.groupId}`}
                  className="flex items-center gap-3 bg-bg-card hover:bg-bg-card-hover rounded-2xl p-3 border border-border transition-colors"
                >
                  <Avatar name={item.actorName} id={item.actorId} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.description}</p>
                    <p className="text-xs text-text-secondary">
                      {item.groupEmoji} {item.groupName} &middot; {actorLabel} &middot; {formatDate(item.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        item.type === 'settlement' ? 'text-positive' : 'text-zec-gold'
                      }`}
                    >
                      {formatZec(item.amount)}
                    </p>
                    <p className="text-[10px] text-text-muted uppercase">
                      {item.type === 'settlement' ? 'settled' : 'expense'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
