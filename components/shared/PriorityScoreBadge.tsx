import { Badge } from '@/components/ui/badge';

const TIER_CONFIG = {
  high: { className: 'bg-red-100 text-red-700 border-red-200', label: 'High' },
  medium: { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Med' },
  low: { className: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Low' },
};

interface Props {
  score: number;
  tier: 'high' | 'medium' | 'low';
  showScore?: boolean;
}

export function PriorityScoreBadge({ score, tier, showScore = true }: Props) {
  const { className, label } = TIER_CONFIG[tier];
  return (
    <Badge variant="outline" className={`text-xs font-medium ${className}`}>
      {label}{showScore ? ` · ${score}` : ''}
    </Badge>
  );
}
