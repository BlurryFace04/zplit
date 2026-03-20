import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/PageHeader';

export function JoinGroup() {
  const { code: urlCode } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { joinGroupByCode, userName } = useStore();
  const attemptedAutoJoin = useRef(false);

  const [code, setCode] = useState(urlCode?.toUpperCase() ?? '');
  const [displayName, setDisplayName] = useState(userName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleJoin = async (joinCode: string) => {
    if (!joinCode.trim()) {
      setError('Please enter an invite code.');
      return;
    }
    if (!displayName.trim()) {
      setError('Please enter your name so group members know who you are.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const store = useStore.getState();
    if (displayName.trim() !== store.userName) {
      store.setUserName(displayName.trim());
    }

    try {
      const result = await joinGroupByCode(joinCode.trim().toUpperCase());
      if (result) {
        setSuccess(`Joined "${result.groupName}"! Redirecting...`);
        setTimeout(() => {
          navigate(`/groups/${result.groupId}`, { replace: true });
        }, 800);
      } else {
        setError('Invalid invite code. Double-check it and try again.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
        setError('Permission denied. Firestore rules may be blocking access.');
      } else {
        setError(`Failed to join group: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlCode && displayName.trim() && !attemptedAutoJoin.current) {
      attemptedAutoJoin.current = true;
      handleJoin(urlCode);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Join Group" showBack />
      <div className="px-4 py-6 space-y-5">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-zec-gold/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🤝</span>
          </div>
          <h2 className="text-lg font-bold mb-1">Join a Group</h2>
          <p className="text-sm text-text-secondary">
            Enter your name and the invite code to join
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">
            Your Name <span className="text-negative">*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Rahul"
            className={`w-full px-4 py-3 rounded-xl text-sm ${
              error && !displayName.trim()
                ? 'ring-2 ring-negative/50'
                : ''
            }`}
          />
          {error && !displayName.trim() && (
            <p className="text-[11px] text-negative mt-1">Name is required</p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">
            Invite Code <span className="text-negative">*</span>
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder="e.g. A3X9BK7P"
            className={`w-full px-4 py-3 rounded-xl text-sm text-center font-mono tracking-widest text-lg ${
              error && !code.trim()
                ? 'ring-2 ring-negative/50'
                : ''
            }`}
            maxLength={8}
          />
          {error && !code.trim() && (
            <p className="text-[11px] text-negative mt-1">Invite code is required</p>
          )}
        </div>

        {error && displayName.trim() && code.trim() && (
          <div className="bg-negative/10 border border-negative/20 rounded-xl p-3">
            <p className="text-xs text-negative text-center">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-positive/10 border border-positive/20 rounded-xl p-3">
            <p className="text-xs text-positive text-center font-medium">{success}</p>
          </div>
        )}

        <button
          onClick={() => handleJoin(code)}
          disabled={loading}
          className="w-full bg-zec-gold text-bg-primary font-bold py-3 rounded-xl text-sm transition-all hover:bg-zec-gold-dim disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Joining...' : 'Join Group'}
        </button>
      </div>
    </div>
  );
}
