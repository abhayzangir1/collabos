import { format, formatDistanceToNow } from 'date-fns';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy · h:mm a');
}

export function formatShortDate(dateStr: string): string {
  return format(new Date(dateStr), 'MM/dd/yy');
}

export function formatBadgeCount(count: number): string {
  if (count > 99) return '99+';
  return String(count);
}

export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return String(num);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Proposed': return 'neu-badge-info';
    case 'Active':
    case 'In Progress': return 'neu-badge-gold';
    case 'Completed': return 'neu-badge-success';
    case 'Declined': return 'neu-badge-muted';
    case 'Disputed':
    case 'Open': return 'neu-badge-error';
    case 'Under Review': return 'neu-badge-warning';
    case 'Resolved': return 'neu-badge-success';
    case 'Pending': return 'neu-badge-muted';
    case 'Awaiting Confirmation': return 'neu-badge-warning';
    default: return 'neu-badge-muted';
  }
}

export function validateFileUpload(file: File, allowedTypes: string[], maxSizeMB: number): string | null {
  if (!allowedTypes.includes(file.type)) {
    return `File type "${file.type}" not allowed. Accepted: ${allowedTypes.join(', ')}`;
  }
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `File size exceeds ${maxSizeMB}MB limit.`;
  }
  return null;
}

export function getDomainColor(domain: string): string {
  const colors: Record<string, string> = {
    'Engineering': '#3B82F6',
    'Design': '#EC4899',
    'Marketing': '#F59E0B',
    'Writing': '#8B5CF6',
    'Data & Analytics': '#06B6D4',
    'Operations': '#22C55E',
    'Legal & Finance': '#6366F1',
    'Others': '#9CA3AF',
    'Custom': '#C9A84C',
  };
  return colors[domain] ?? '#9CA3AF';
}
