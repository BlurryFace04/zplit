import { useState } from 'react';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/PageHeader';

export function Settings() {
  const { userName, userZecAddress, setUserName, setUserZecAddress } = useStore();
  const [nameInput, setNameInput] = useState(userName);
  const [addressInput, setAddressInput] = useState(userZecAddress);
  const [addressError, setAddressError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const hasChanges = nameInput !== userName || addressInput !== userZecAddress;

  const handleSave = async () => {
    if (!nameInput.trim()) return;
    const addr = addressInput.trim();
    if (addr && !addr.startsWith('zs') && !addr.startsWith('t1') && !addr.startsWith('t3') && !addr.startsWith('u1')) {
      setAddressError('ZEC address should start with zs, t1, t3, or u1.');
      return;
    }
    setAddressError('');
    setUserName(nameInput.trim());
    setUserZecAddress(addr);

    setSyncing(true);
    try {
      await useStore.getState().syncProfileToGroups();
      setSynced(true);
      setTimeout(() => setSynced(false), 2000);
    } catch {
      setAddressError('Failed to sync profile to groups. Try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Settings" />
      <div className="px-4 py-4 space-y-6">
        <div>
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">
            Your Name
          </label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 rounded-xl text-sm"
          />
          <p className="text-xs text-text-muted mt-1">
            This is how other group members see you. Required for creating or joining groups.
          </p>
          {!nameInput.trim() && (
            <p className="text-xs text-zec-gold mt-1 font-medium">
              Set your name to start using Zplit.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">
            Your ZEC Address
          </label>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
              setAddressError('');
            }}
            placeholder="zs1..."
            className={`w-full px-4 py-3 rounded-xl text-sm font-mono ${
              addressError ? 'ring-2 ring-negative/50' : ''
            }`}
          />
          {addressError ? (
            <p className="text-xs text-negative mt-1">{addressError}</p>
          ) : (
            <p className="text-xs text-text-muted mt-1">
              Optional. Others can send you ZEC here when settling debts.
            </p>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!nameInput.trim() || syncing || (!hasChanges && !syncing)}
          className={`w-full font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            synced
              ? 'bg-positive/20 text-positive'
              : 'bg-zec-gold text-bg-primary hover:bg-zec-gold-dim'
          }`}
        >
          {syncing ? 'Saving...' : synced ? 'Saved & Synced!' : hasChanges ? 'Save Changes' : 'No Changes'}
        </button>

        <div className="bg-bg-card rounded-2xl p-4 border border-border">
          <h3 className="text-sm font-semibold mb-2">About Zplit</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Zplit is a Splitwise-style expense splitter built for Zcash (ZEC). Track shared expenses,
            calculate balances, and settle debts with friends — all denominated in ZEC.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-zec-gold/10 flex items-center justify-center">
              <span className="text-zec-gold font-bold text-xs">Z</span>
            </div>
            <span className="text-xs text-text-muted">v1.0.0 &middot; PWA</span>
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-4 border border-border">
          <h3 className="text-sm font-semibold mb-1">Data &amp; Sync</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Group data is synced in real-time via Firebase so all members see the same
            expenses and balances. Your name and settings are stored locally on your device.
          </p>
        </div>
      </div>
    </div>
  );
}
