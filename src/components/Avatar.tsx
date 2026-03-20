import { getInitials, getAvatarColor } from '../utils/format';

interface AvatarProps {
  name: string;
  id: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export function Avatar({ name, id, size = 'md' }: AvatarProps) {
  const color = getAvatarColor(id);
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{ backgroundColor: color + '22', color }}
    >
      {getInitials(name)}
    </div>
  );
}
