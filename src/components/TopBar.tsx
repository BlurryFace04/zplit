import { WalletButton } from './WalletButton';

export function TopBar() {
  return (
    <div className="sticky top-0 z-50 bg-bg-primary/90 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 py-2.5 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-zec-gold/10 flex items-center justify-center">
            <span className="text-zec-gold font-bold text-sm">Z</span>
          </div>
          <span className="font-bold text-sm">
            <span className="text-zec-gold">Z</span>plit
          </span>
        </div>
        <WalletButton />
      </div>
    </div>
  );
}
