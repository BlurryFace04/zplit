import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';

export function Groups() {
  const { groups, expenses } = useStore();

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title="Groups"
        right={
          <div className="flex gap-2">
            <Link
              to="/join"
              className="bg-bg-card text-text-primary border border-border font-semibold px-3 py-1.5 rounded-lg text-sm hover:border-zec-gold/40 hover:bg-bg-card-hover transition-colors"
            >
              Join
            </Link>
            <Link
              to="/groups/new"
              className="bg-zec-gold text-bg-primary font-semibold px-3 py-1.5 rounded-lg text-sm hover:bg-zec-gold-dim transition-colors"
            >
              + New
            </Link>
          </div>
        }
      />
      <div className="px-4 py-4">
        {groups.length === 0 ? (
          <EmptyState
            icon="👥"
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
          <div className="space-y-3">
            {groups.map((group) => {
              const groupExpenseCount = expenses.filter(
                (e) => e.groupId === group.id
              ).length;
              return (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="flex items-center gap-3 bg-bg-card hover:bg-bg-card-hover rounded-2xl p-4 border border-border transition-colors"
                >
                  <span className="text-3xl">{group.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{group.name}</p>
                    <p className="text-xs text-text-secondary">
                      {group.members.length} members &middot;{' '}
                      {groupExpenseCount} expense{groupExpenseCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
