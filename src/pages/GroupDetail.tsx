import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { calculateBalances, simplifyDebts } from '../utils/balance';
import { formatZec, formatDate } from '../utils/format';
import { PageHeader } from '../components/PageHeader';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { PayWithZec } from '../components/PayWithZec';

type Tab = 'expenses' | 'balances' | 'settle' | 'members';

export function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { groups, expenses, settlements, deleteGroup, deleteExpense, addSettlement, updateMemberZecAddress } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [copiedShare, setCopiedShare] = useState<'code' | 'link' | null>(null);
  const [actionError, setActionError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [settlingDebt, setSettlingDebt] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null);

  const group = groups.find((g) => g.id === id);
  if (!group) {
    return (
      <div className="max-w-lg mx-auto">
        <PageHeader title="Group not found" showBack />
        <EmptyState icon="🔍" title="Group not found" description="This group may have been deleted" />
      </div>
    );
  }

  const groupExpenses = expenses
    .filter((e) => e.groupId === group.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const groupSettlements = settlements.filter((s) => s.groupId === group.id);
  const balances = calculateBalances(group.members, groupExpenses, groupSettlements);
  const debts = simplifyDebts(group.members, groupExpenses, groupSettlements);

  const memberLabel = (memberId: string, name: string) =>
    memberId === group.myMemberId ? 'You' : name;

  const inviteLink = group.inviteCode
    ? `${window.location.origin}/join/${group.inviteCode}`
    : '';

  const clearError = () => setActionError('');

  const handleSettle = async (fromId: string, toId: string, amount: number) => {
    const key = `${fromId}-${toId}`;
    setSettlingDebt(key);
    clearError();
    try {
      await addSettlement({
        groupId: group.id,
        fromMemberId: fromId,
        toMemberId: toId,
        amount,
        date: new Date().toISOString(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(`Failed to record settlement: ${msg}`);
    } finally {
      setSettlingDebt(null);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    setDeletingExpense(expenseId);
    clearError();
    try {
      await deleteExpense(group.id, expenseId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(`Failed to delete expense: ${msg}`);
    } finally {
      setDeletingExpense(null);
    }
  };

  const handleDeleteGroup = async () => {
    setDeleting(true);
    clearError();
    try {
      await deleteGroup(group.id);
      navigate('/groups', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(`Failed to delete group: ${msg}`);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveAddress = async (memberId: string) => {
    if (!addressInput.trim()) {
      setActionError('Please enter a ZEC address.');
      return;
    }
    const addr = addressInput.trim();
    if (!addr.startsWith('zs') && !addr.startsWith('t1') && !addr.startsWith('t3') && !addr.startsWith('u1')) {
      setActionError('Invalid ZEC address. Should start with zs, t1, t3, or u1.');
      return;
    }
    setSavingAddress(true);
    clearError();
    try {
      await updateMemberZecAddress(group.id, memberId, addr);
      setEditingAddress(null);
      setAddressInput('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(`Failed to save address: ${msg}`);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleCopyShare = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedShare(type);
      setTimeout(() => setCopiedShare(null), 2000);
    } catch { /* ignore */ }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${group.name} on Zplit`,
          text: `Join my group "${group.name}" on Zplit to split expenses in ZEC!`,
          url: inviteLink,
        });
      } catch { /* user cancelled */ }
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'expenses', label: 'Expenses' },
    { key: 'balances', label: 'Balances' },
    { key: 'settle', label: 'Settle Up' },
    { key: 'members', label: 'Members' },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title={`${group.emoji} ${group.name}`}
        subtitle={`${group.members.length} member${group.members.length !== 1 ? 's' : ''}`}
        showBack
        right={
          <div className="flex gap-2">
            {group.inviteCode && (
              <button
                onClick={() => setShowShareModal(true)}
                className="p-1.5 rounded-lg hover:bg-zec-gold/10 text-zec-gold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            )}
            <Link
              to={`/groups/${group.id}/expense`}
              className="bg-zec-gold text-bg-primary font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-zec-gold-dim transition-colors"
            >
              + Expense
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-lg hover:bg-negative/20 text-text-muted hover:text-negative transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        }
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-bg-card border border-border rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-1">Share Group</h3>
            <p className="text-xs text-text-secondary mb-4">
              Invite others to join &ldquo;{group.name}&rdquo;
            </p>

            <div className="space-y-3 mb-4">
              <div className="bg-bg-secondary rounded-xl p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Invite Code</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-lg font-bold tracking-widest text-zec-gold">{group.inviteCode}</p>
                  <button
                    onClick={() => handleCopyShare(group.inviteCode!, 'code')}
                    className="text-xs text-zec-gold font-medium"
                  >
                    {copiedShare === 'code' ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleCopyShare(inviteLink, 'link')}
                className="w-full bg-bg-secondary rounded-xl p-3 text-left hover:bg-bg-card-hover transition-colors"
              >
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Invite Link</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-secondary truncate flex-1 mr-2">{inviteLink}</p>
                  <span className="text-xs text-zec-gold font-medium shrink-0">
                    {copiedShare === 'link' ? '✓ Copied!' : 'Copy'}
                  </span>
                </div>
              </button>
            </div>

            <div className="flex gap-2">
              {'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="flex-1 py-2.5 rounded-xl bg-zec-gold text-bg-primary text-sm font-bold hover:bg-zec-gold-dim transition-colors"
                >
                  Share
                </button>
              )}
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-bg-secondary border border-border text-sm font-medium hover:bg-bg-card-hover transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Delete group?</h3>
            <p className="text-sm text-text-secondary mb-4">
              This will permanently delete &ldquo;{group.name}&rdquo; and all its expenses for everyone. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-bg-secondary border border-border text-sm font-medium hover:bg-bg-card-hover transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-negative text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline error toast */}
      {actionError && (
        <div className="mx-4 mt-2 bg-negative/10 border border-negative/20 rounded-xl p-3 flex items-center justify-between">
          <p className="text-xs text-negative">{actionError}</p>
          <button onClick={clearError} className="text-negative/60 hover:text-negative ml-2 shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); clearError(); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.key ? 'text-zec-gold' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-zec-gold rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {activeTab === 'expenses' && (
          <>
            {groupExpenses.length === 0 ? (
              <EmptyState
                icon="📝"
                title="No expenses yet"
                description={
                  group.members.length < 2
                    ? 'Share the invite link to add members, then start tracking expenses'
                    : 'Add your first expense to start tracking'
                }
                action={
                  group.members.length >= 2 ? (
                    <Link
                      to={`/groups/${group.id}/expense`}
                      className="bg-zec-gold text-bg-primary font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-zec-gold-dim transition-colors"
                    >
                      Add Expense
                    </Link>
                  ) : (
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="bg-zec-gold text-bg-primary font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-zec-gold-dim transition-colors"
                    >
                      Share Invite Link
                    </button>
                  )
                }
              />
            ) : (
              <div className="space-y-2">
                {groupExpenses.map((expense) => {
                  const payer = group.members.find((m) => m.id === expense.paidBy);
                  const payerLabel = payer ? memberLabel(payer.id, payer.name) : '?';
                  const isDeleting = deletingExpense === expense.id;
                  return (
                    <div
                      key={expense.id}
                      className={`flex items-center gap-3 bg-bg-card rounded-2xl p-3 border border-border group ${isDeleting ? 'opacity-50' : ''}`}
                    >
                      <Link
                        to={`/groups/${group.id}/expense/${expense.id}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <Avatar name={payer?.name ?? '?'} id={expense.paidBy} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{expense.description}</p>
                          <p className="text-xs text-text-secondary">
                            {payerLabel} paid &middot; Split {expense.splitAmong.length} ways &middot;{' '}
                            {formatDate(expense.date)}
                          </p>
                        </div>
                      </Link>
                      <div className="text-right flex items-center gap-2 shrink-0">
                        <p className="text-sm font-semibold text-zec-gold">
                          {formatZec(expense.amount)}
                        </p>
                        <Link
                          to={`/groups/${group.id}/expense/${expense.id}`}
                          className="p-1 rounded text-text-muted hover:text-zec-gold transition-all opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          disabled={isDeleting}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-negative/20 text-text-muted hover:text-negative transition-all disabled:opacity-30"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'balances' && (
          <div className="space-y-2">
            {balances.map((balance) => {
              const isMe = balance.memberId === group.myMemberId;
              return (
                <div
                  key={balance.memberId}
                  className={`flex items-center gap-3 rounded-2xl p-3 border transition-colors ${
                    isMe ? 'bg-zec-gold/5 border-zec-gold/20' : 'bg-bg-card border-border'
                  }`}
                >
                  <Avatar name={balance.memberName} id={balance.memberId} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {memberLabel(balance.memberId, balance.memberName)}
                      {isMe && (
                        <span className="text-[9px] bg-zec-gold/15 text-zec-gold px-1 py-0.5 rounded-full font-medium ml-1.5">
                          you
                        </span>
                      )}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      balance.amount > 0
                        ? 'text-positive'
                        : balance.amount < 0
                          ? 'text-negative'
                          : 'text-text-muted'
                    }`}
                  >
                    {balance.amount > 0 ? '+' : ''}
                    {formatZec(balance.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'settle' && (
          <>
            {debts.length === 0 ? (
              <EmptyState
                icon="✅"
                title="All settled up!"
                description="No outstanding debts in this group"
              />
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-text-secondary">
                  Simplified payments to minimize transactions:
                </p>
                {debts.map((debt, idx) => {
                  const fromLabel = memberLabel(debt.from, debt.fromName);
                  const toLabel = memberLabel(debt.to, debt.toName);
                  const toMember = group.members.find((m) => m.id === debt.to);
                  const fromIsMe = debt.from === group.myMemberId;
                  const recipientAddress = toMember?.zecAddress;
                  const debtKey = `${debt.from}-${debt.to}`;
                  const isSettling = settlingDebt === debtKey;

                  return (
                    <div key={idx} className="bg-bg-card rounded-2xl p-4 border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-center">
                          <Avatar name={debt.fromName} id={debt.from} size="sm" />
                          <p className="text-[10px] text-text-secondary mt-1">{fromLabel}</p>
                        </div>
                        <div className="flex-1 text-center">
                          <svg className="w-5 h-5 text-zec-gold mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <p className="text-xs text-zec-gold font-semibold mt-0.5">
                            {formatZec(debt.amount)}
                          </p>
                        </div>
                        <div className="text-center">
                          <Avatar name={debt.toName} id={debt.to} size="sm" />
                          <p className="text-[10px] text-text-secondary mt-1">{toLabel}</p>
                        </div>
                      </div>

                      <p className="text-xs text-text-secondary text-center mb-3">
                        <span className="font-medium text-text-primary">{fromLabel}</span> owes{' '}
                        <span className="font-medium text-text-primary">{toLabel}</span>
                      </p>

                      {fromIsMe && recipientAddress ? (
                        <PayWithZec
                          recipientAddress={recipientAddress}
                          recipientName={toLabel}
                          amount={debt.amount}
                          memo={`Zplit: ${group.name} settlement`}
                          onSettled={() => handleSettle(debt.from, debt.to, debt.amount)}
                        />
                      ) : fromIsMe && !recipientAddress ? (
                        <div className="space-y-2">
                          <div className="bg-bg-secondary rounded-xl p-3 border border-border">
                            <p className="text-xs text-text-muted text-center">
                              No ZEC address set for {toLabel}. Add it in the{' '}
                              <button
                                onClick={() => setActiveTab('members')}
                                className="text-zec-gold font-medium hover:underline"
                              >
                                Members
                              </button>{' '}
                              tab to enable wallet payments.
                            </p>
                          </div>
                          <button
                            onClick={() => handleSettle(debt.from, debt.to, debt.amount)}
                            disabled={isSettling}
                            className="w-full bg-positive/10 text-positive font-semibold py-2 rounded-xl text-xs hover:bg-positive/20 transition-colors disabled:opacity-40"
                          >
                            {isSettling ? 'Recording...' : 'Mark as Settled (paid externally)'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSettle(debt.from, debt.to, debt.amount)}
                          disabled={isSettling}
                          className="w-full bg-positive/10 text-positive font-semibold py-2 rounded-xl text-xs hover:bg-positive/20 transition-colors disabled:opacity-40"
                        >
                          {isSettling ? 'Recording...' : 'Mark as Settled'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'members' && (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary">
              Set ZEC addresses to enable in-app wallet payments during settlement.
            </p>
            {group.members.map((member) => {
              const isMe = member.id === group.myMemberId;
              const isEditing = editingAddress === member.id;

              return (
                <div
                  key={member.id}
                  className={`rounded-2xl p-4 border ${
                    isMe ? 'bg-zec-gold/5 border-zec-gold/20' : 'bg-bg-card border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar name={member.name} id={member.id} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {isMe ? 'You' : member.name}
                        {isMe && (
                          <span className="text-[9px] bg-zec-gold/15 text-zec-gold px-1 py-0.5 rounded-full font-medium ml-1.5">
                            you
                          </span>
                        )}
                      </p>
                      {member.zecAddress && !isEditing && (
                        <p className="text-xs font-mono text-text-muted truncate">{member.zecAddress}</p>
                      )}
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingAddress(member.id);
                          setAddressInput(member.zecAddress ?? '');
                          clearError();
                        }}
                        className="text-xs text-zec-gold font-medium hover:text-zec-gold-dim transition-colors shrink-0"
                      >
                        {member.zecAddress ? 'Edit' : '+ Address'}
                      </button>
                    )}
                  </div>

                  {isEditing && (
                    <div className="space-y-2 mt-2">
                      <input
                        type="text"
                        value={addressInput}
                        onChange={(e) => {
                          setAddressInput(e.target.value);
                          clearError();
                        }}
                        placeholder="zs1... or t1..."
                        className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingAddress(null);
                            setAddressInput('');
                            clearError();
                          }}
                          disabled={savingAddress}
                          className="flex-1 py-2 rounded-lg bg-bg-secondary border border-border text-xs font-medium hover:bg-bg-card-hover transition-colors disabled:opacity-40"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveAddress(member.id)}
                          disabled={savingAddress}
                          className="flex-1 py-2 rounded-lg bg-zec-gold text-bg-primary text-xs font-bold hover:bg-zec-gold-dim transition-colors disabled:opacity-40"
                        >
                          {savingAddress ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
