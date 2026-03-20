import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/PageHeader';
import { Avatar } from '../components/Avatar';

export function AddExpense() {
  const { id: groupId, expenseId } = useParams<{ id: string; expenseId: string }>();
  const navigate = useNavigate();
  const { groups, expenses, addExpense, editExpense } = useStore();

  const group = groups.find((g) => g.id === groupId);
  const existingExpense = expenseId
    ? expenses.find((e) => e.id === expenseId && e.groupId === groupId)
    : null;
  const isEditing = !!existingExpense;

  const [description, setDescription] = useState(existingExpense?.description ?? '');
  const [amount, setAmount] = useState(existingExpense ? String(existingExpense.amount) : '');
  const [paidBy, setPaidBy] = useState(
    existingExpense?.paidBy ?? group?.myMemberId ?? group?.members[0]?.id ?? ''
  );
  const [splitAmong, setSplitAmong] = useState<string[]>(
    existingExpense?.splitAmong ?? group?.members.map((m) => m.id) ?? []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!group) {
    return (
      <div className="max-w-lg mx-auto">
        <PageHeader title="Group not found" showBack />
      </div>
    );
  }

  if (isEditing && !existingExpense) {
    return (
      <div className="max-w-lg mx-auto">
        <PageHeader title="Expense not found" showBack />
      </div>
    );
  }

  if (group.members.length < 2) {
    return (
      <div className="max-w-lg mx-auto">
        <PageHeader title={isEditing ? 'Edit Expense' : 'Add Expense'} subtitle={`${group.emoji} ${group.name}`} showBack />
        <div className="px-4 py-8">
          <div className="bg-zec-gold/5 border border-zec-gold/30 rounded-2xl p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-zec-gold/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-zec-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold mb-1">Need at least 2 members</p>
            <p className="text-xs text-text-secondary">
              Share the invite link from the group page so someone can join before adding expenses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const toggleMember = (memberId: string) => {
    setSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const parsedAmount = parseFloat(amount);
  const canSubmit =
    description.trim() &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    paidBy &&
    splitAmong.length > 0 &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please add a description.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (splitAmong.length === 0) {
      setError('Select at least one person to split among.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (isEditing && existingExpense) {
        await editExpense({
          ...existingExpense,
          description: description.trim(),
          amount: parsedAmount,
          paidBy,
          splitAmong,
        });
      } else {
        await addExpense({
          groupId: group.id,
          description: description.trim(),
          amount: parsedAmount,
          paidBy,
          splitAmong,
          date: new Date().toISOString(),
        });
      }
      navigate(`/groups/${group.id}`, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to ${isEditing ? 'update' : 'add'} expense: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const perPersonShare = canSubmit ? parsedAmount / splitAmong.length : 0;

  const memberLabel = (m: { id: string; name: string; isMe?: boolean }) =>
    m.id === group.myMemberId ? 'You' : m.name;

  const sortedMembers = [...group.members].sort((a, b) => {
    if (a.id === group.myMemberId) return -1;
    if (b.id === group.myMemberId) return 1;
    return 0;
  });

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title={isEditing ? 'Edit Expense' : 'Add Expense'}
        subtitle={`${group.emoji} ${group.name}`}
        showBack
      />
      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        <div>
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError('');
            }}
            placeholder="e.g. Dinner at restaurant"
            className="w-full px-4 py-3 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">
            Amount (ZEC)
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl text-sm pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zec-gold">
              ZEC
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">
            Paid by
          </label>
          <div className="grid grid-cols-2 gap-2">
            {sortedMembers.map((member) => {
              const isMe = member.id === group.myMemberId;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setPaidBy(member.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl text-sm transition-all ${
                    paidBy === member.id
                      ? 'bg-zec-gold/15 ring-2 ring-zec-gold text-zec-gold'
                      : 'bg-bg-card border border-border hover:bg-bg-card-hover'
                  }`}
                >
                  <Avatar name={member.name} id={member.id} size="sm" />
                  <span className="truncate font-medium">{memberLabel(member)}</span>
                  {isMe && (
                    <span className="text-[9px] bg-zec-gold/15 text-zec-gold px-1 py-0.5 rounded-full font-medium shrink-0">
                      you
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">
            Split among
          </label>
          <div className="space-y-2">
            {sortedMembers.map((member) => {
              const isSelected = splitAmong.includes(member.id);
              const isMe = member.id === group.myMemberId;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm transition-all ${
                    isSelected
                      ? 'bg-zec-gold/10 ring-1 ring-zec-gold/50'
                      : 'bg-bg-card border border-border hover:bg-bg-card-hover opacity-50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-zec-gold border-zec-gold' : 'border-border'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-bg-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <Avatar name={member.name} id={member.id} size="sm" />
                  <span className="font-medium flex-1 text-left">
                    {memberLabel(member)}
                    {isMe && (
                      <span className="text-[9px] bg-zec-gold/15 text-zec-gold px-1 py-0.5 rounded-full font-medium ml-1.5">
                        you
                      </span>
                    )}
                  </span>
                  {isSelected && perPersonShare > 0 && (
                    <span className="text-xs text-zec-gold font-medium">
                      {perPersonShare.toFixed(4)} ZEC
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {canSubmit && (
          <div className="bg-bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-text-secondary mb-1">Split equally</p>
            <p className="text-sm">
              <span className="font-semibold text-zec-gold">{perPersonShare.toFixed(4)} ZEC</span>
              <span className="text-text-secondary"> per person</span>
            </p>
          </div>
        )}

        {error && (
          <div className="bg-negative/10 border border-negative/20 rounded-xl p-3">
            <p className="text-xs text-negative text-center">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-zec-gold text-bg-primary font-bold py-3 rounded-xl text-sm transition-all hover:bg-zec-gold-dim disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting
            ? (isEditing ? 'Saving...' : 'Adding...')
            : (isEditing ? 'Save Changes' : 'Add Expense')
          }
        </button>
      </form>
    </div>
  );
}
