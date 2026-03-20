import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';

export function WalletButton() {
  const { userZecAddress, setUserZecAddress, userName, setUserName, syncProfileToGroups } = useStore();
  const [open, setOpen] = useState(false);
  const [addressInput, setAddressInput] = useState(userZecAddress);
  const [nameInput, setNameInput] = useState(userName);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const connected = !!userName;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setAddressInput(userZecAddress);
      setNameInput(userName);
      setError('');
      setEditing(!connected);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const truncated = userZecAddress
    ? `${userZecAddress.slice(0, 6)}...${userZecAddress.slice(-4)}`
    : '';

  const handleSave = () => {
    if (!nameInput.trim()) {
      setError('Name is required.');
      return;
    }
    const addr = addressInput.trim();
    if (addr && !addr.startsWith('zs') && !addr.startsWith('t1') && !addr.startsWith('t3') && !addr.startsWith('u1')) {
      setError('Invalid ZEC address. Should start with zs, t1, t3, or u1.');
      return;
    }
    setUserName(nameInput.trim());
    setUserZecAddress(addr);
    setError('');
    setEditing(false);
    if (!connected) setOpen(false);
    syncProfileToGroups().catch(() => {});
  };

  const handleDisconnect = () => {
    setUserZecAddress('');
    setUserName('');
    setEditing(false);
    setOpen(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userZecAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
          connected
            ? 'bg-bg-card text-text-primary border border-border hover:border-zec-gold/40 hover:bg-bg-card-hover'
            : 'bg-zec-gold/10 text-zec-gold border border-zec-gold/30 hover:bg-zec-gold/20'
        }`}
      >
        {connected ? (
          <>
            <span className="w-5 h-5 rounded-full bg-zec-gold/20 flex items-center justify-center text-[10px] font-bold text-zec-gold">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="max-w-[80px] truncate">{userZecAddress ? truncated : userName}</span>
            {userZecAddress && (
              <span className="w-1.5 h-1.5 rounded-full bg-positive shrink-0" />
            )}
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Set Up Profile
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-bg-card border border-border rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          {connected && !editing ? (
            <>
              <div className="bg-gradient-to-br from-zec-gold/8 to-transparent p-5 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-zec-gold/15 flex items-center justify-center text-base font-bold text-zec-gold shrink-0">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{userName}</p>
                    {userZecAddress ? (
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 mt-0.5 group"
                      >
                        <p className="text-[11px] font-mono text-text-muted truncate">
                          {truncated}
                        </p>
                        <span className="text-[10px] text-zec-gold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {copied ? '✓' : 'copy'}
                        </span>
                      </button>
                    ) : (
                      <p className="text-[11px] text-text-muted mt-0.5">No ZEC address</p>
                    )}
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[11px] text-zec-gold font-medium hover:text-zec-gold-dim transition-colors shrink-0 mt-0.5"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {!userZecAddress && (
                <div className="px-5 pb-3">
                  <div className="flex items-start gap-2 bg-zec-gold/5 border border-zec-gold/15 rounded-xl p-3">
                    <svg className="w-3.5 h-3.5 text-zec-gold shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      Add a ZEC address so others can send you payments when settling debts.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex border-t border-border">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 py-3 text-xs font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
                >
                  Close
                </button>
                <div className="w-px bg-border" />
                <button
                  onClick={handleDisconnect}
                  className="flex-1 py-3 text-xs font-medium text-negative/70 hover:text-negative hover:bg-negative/5 transition-colors"
                >
                  Reset Profile
                </button>
              </div>
            </>
          ) : (
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-zec-gold/10 flex items-center justify-center">
                  {nameInput.trim() ? (
                    <span className="text-zec-gold font-bold text-sm">
                      {nameInput.trim().charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <svg className="w-4 h-4 text-zec-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {connected ? 'Edit Profile' : 'Set Up Profile'}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {connected ? 'Update your name or ZEC address' : 'Add your name to get started'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
                    Name <span className="text-negative">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      setError('');
                    }}
                    placeholder="What should others call you?"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm ${
                      error && !nameInput.trim() ? 'ring-2 ring-negative/50' : ''
                    }`}
                    autoFocus
                  />
                  {error && !nameInput.trim() && (
                    <p className="text-[10px] text-negative mt-1">Name is required</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1.5 block">
                    ZEC Address <span className="text-text-muted">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => {
                      setAddressInput(e.target.value);
                      setError('');
                    }}
                    placeholder="zs1... or t1..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
                  />
                  {error && nameInput.trim() && (
                    <p className="text-[10px] text-negative mt-1">{error}</p>
                  )}
                  <p className="text-[10px] text-text-muted mt-1">
                    Needed to receive ZEC when others settle debts with you
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {connected && (
                  <button
                    onClick={() => {
                      setEditing(false);
                      setNameInput(userName);
                      setAddressInput(userZecAddress);
                      setError('');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-bg-secondary border border-border text-xs font-medium hover:bg-bg-card-hover transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl bg-zec-gold text-bg-primary font-bold text-xs transition-all hover:bg-zec-gold-dim"
                >
                  {connected ? 'Save Changes' : 'Get Started'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
