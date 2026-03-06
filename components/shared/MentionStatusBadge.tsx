import { Badge } from '@/components/ui/badge';
import type { MentionStatus } from '@/types';

const CONFIG: Record<MentionStatus, { label: string; className: string }> = {
  mentioned: { label: 'Mentioned', className: 'bg-green-100 text-green-800 border-green-200' },
  not_mentioned: { label: 'Not Mentioned', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  competitor_only: { label: 'Gap', className: 'bg-red-100 text-red-700 border-red-200' },
};

export function MentionStatusBadge({ status }: { status: MentionStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <Badge variant="outline" className={`text-xs font-medium ${className}`}>
      {label}
    </Badge>
  );
}
