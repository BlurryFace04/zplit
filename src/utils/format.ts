export function formatZec(amount: number): string {
  if (amount === 0) return '0 ZEC';
  if (Math.abs(amount) < 0.0001) {
    return `${amount.toFixed(8)} ZEC`;
  }
  if (Math.abs(amount) < 1) {
    return `${amount.toFixed(4)} ZEC`;
  }
  return `${amount.toFixed(4)} ZEC`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  '#F4B728', '#34D399', '#60A5FA', '#F87171',
  '#A78BFA', '#FB923C', '#2DD4BF', '#E879F9',
  '#FBBF24', '#6EE7B7',
];

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
