import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatZec } from '../utils/format';

interface PayWithZecProps {
  recipientAddress: string;
  recipientName: string;
  amount: number;
  memo?: string;
  onSettled: () => void;
}

type CopiedField = 'address' | 'amount' | null;

export function PayWithZec({ recipientAddress, recipientName, amount, memo, onSettled }: PayWithZecProps) {
  const [copiedField, setCopiedField] = useState<CopiedField>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const zcashUri = buildZcashUri(recipientAddress, amount, memo);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const handleCopy = async (text: string, field: CopiedField) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch { /* ignore */ }
  };

  const handleOpenWallet = () => {
    window.location.href = `zcash:`;
  };

  return (
    <div className="space-y-3">
      {isMobile && (
        <button
          onClick={handleOpenWallet}
          className="w-full flex items-center justify-center gap-2.5 bg-zec-gold text-bg-primary font-bold py-3 rounded-xl text-sm hover:bg-zec-gold-dim transition-colors active:scale-[0.98]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h5.25A2.25 2.25 0 0121 6m0 6v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25h13.5" />
          </svg>
          Open ZEC Wallet
        </button>
      )}

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-center gap-2 bg-bg-secondary border border-border text-text-secondary font-medium py-2.5 rounded-xl text-xs hover:bg-bg-card-hover transition-colors"
      >
        {showDetails ? 'Hide' : 'Show'} Payment Details
      </button>

      {showDetails && (
        <div className="space-y-2">
          <button
            onClick={() => handleCopy(recipientAddress, 'address')}
            className="w-full bg-bg-card border border-border rounded-xl p-3 text-left hover:bg-bg-card-hover transition-colors active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">To Address</p>
              <span className={`text-xs font-semibold transition-colors ${copiedField === 'address' ? 'text-positive' : 'text-zec-gold'}`}>
                {copiedField === 'address' ? '✓ Copied!' : 'Tap to copy'}
              </span>
            </div>
            <p className="text-xs font-mono text-text-secondary truncate">{recipientAddress}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{recipientName}</p>
          </button>

          <button
            onClick={() => handleCopy(amount.toFixed(8), 'amount')}
            className="w-full bg-bg-card border border-border rounded-xl p-3 text-left hover:bg-bg-card-hover transition-colors active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Amount</p>
              <span className={`text-xs font-semibold transition-colors ${copiedField === 'amount' ? 'text-positive' : 'text-zec-gold'}`}>
                {copiedField === 'amount' ? '✓ Copied!' : 'Tap to copy'}
              </span>
            </div>
            <p className="text-lg font-bold text-zec-gold">{formatZec(amount)}</p>
          </button>

          <p className="text-[10px] text-text-muted text-center">
            Copy the address and amount, then paste them in your wallet to send.
          </p>
        </div>
      )}

      <button
        onClick={() => setShowQr(!showQr)}
        className="w-full flex items-center justify-center gap-2 bg-bg-secondary border border-border text-text-secondary font-medium py-2.5 rounded-xl text-xs hover:bg-bg-card-hover transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        {showQr ? 'Hide' : 'Show'} QR Code
      </button>

      {showQr && (
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4">
          <QRCodeSVG
            value={zcashUri}
            size={200}
            bgColor="#ffffff"
            fgColor="#0A0A0F"
            level="M"
            includeMargin={false}
          />
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Pay {recipientName}</p>
            <p className="text-sm font-bold text-gray-900">{formatZec(amount)}</p>
          </div>
        </div>
      )}

      <button
        onClick={onSettled}
        className="w-full bg-positive/10 text-positive font-semibold py-2.5 rounded-xl text-xs hover:bg-positive/20 transition-colors"
      >
        Payment Sent — Mark as Settled
      </button>
    </div>
  );
}

function buildZcashUri(address: string, amount: number, memo?: string): string {
  const params = new URLSearchParams();
  params.set('amount', amount.toFixed(8));
  if (memo) {
    params.set('memo', btoa(memo));
  }
  return `zcash:${address}?${params.toString()}`;
}
