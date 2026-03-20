import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/PageHeader';

const EMOJIS = ['🍕', '🏠', '✈️', '🎉', '🚗', '🎮', '🛒', '⚡', '🏖️', '🎬', '💼', '🏋️', '🎵', '🍺', '☕'];

export function CreateGroup() {
  const navigate = useNavigate();
  const { addGroup, userName, userZecAddress, setUserName, setUserZecAddress, syncProfileToGroups } = useStore();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍕');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [inlineName, setInlineName] = useState(userName || '');
  const [inlineAddress, setInlineAddress] = useState(userZecAddress || '');

  const profileReady = !!userName;
  const canSubmit = name.trim() && profileReady && !submitting;

  const handleSaveProfile = () => {
    if (!inlineName.trim()) return;
    setUserName(inlineName.trim());
    if (inlineAddress.trim()) {
      setUserZecAddress(inlineAddress.trim());
    }
    syncProfileToGroups().catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a group name.');
      return;
    }
    if (!userName) {
      setError('Please set your name first so group members know who you are.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const id = await addGroup(name.trim(), emoji, []);
      navigate(`/groups/${id}`, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
        setError('Permission denied. Make sure Firestore rules allow writes. Check Firebase console → Firestore → Rules.');
      } else {
        setError(`Failed to create group: ${msg}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Create Group" showBack />
      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        {!profileReady && (
          <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-zec-gold/8 to-transparent px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zec-gold/15 flex items-center justify-center shrink-0">
                {inlineName.trim() ? (
                  <span className="text-zec-gold font-bold text-sm">
                    {inlineName.trim().charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <svg className="w-4 h-4 text-zec-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">Set up your profile</p>
                <p className="text-[11px] text-text-muted">So group members know who you are</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
                  Your Name <span className="text-negative">*</span>
                </label>
                <input
                  type="text"
                  value={inlineName}
                  onChange={(e) => setInlineName(e.target.value)}
                  placeholder="What should others call you?"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
                  ZEC Address <span className="text-text-muted">(optional)</span>
                </label>
                <input
                  type="text"
                  value={inlineAddress}
                  onChange={(e) => setInlineAddress(e.target.value)}
                  placeholder="zs1... or t1..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
                />
                <p className="text-[10px] text-text-muted mt-1">
                  Needed to receive ZEC when others settle debts
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={!inlineName.trim()}
                className="w-full bg-zec-gold text-bg-primary font-bold py-2.5 rounded-xl text-xs transition-all hover:bg-zec-gold-dim disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save &amp; Continue
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">
            Group Emoji
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                  emoji === e
                    ? 'bg-zec-gold/20 ring-2 ring-zec-gold scale-110'
                    : 'bg-bg-card hover:bg-bg-card-hover'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">
            Group Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Trip to Lisbon"
            className="w-full px-4 py-3 rounded-xl text-sm"
          />
        </div>

        {profileReady && (
          <div className="bg-bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-zec-gold/20 flex items-center justify-center text-xs font-bold text-zec-gold shrink-0">
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="text-text-primary font-medium text-sm">{userName}</span>
              <span className="text-[10px] bg-zec-gold/15 text-zec-gold px-1.5 py-0.5 rounded-full font-medium">
                you
              </span>
            </div>
            <p className="text-xs text-text-muted">
              After creating, share the invite link so others can join.
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
          {submitting ? 'Creating...' : 'Create Group'}
        </button>
      </form>
    </div>
  );
}
