import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  icon?: string;
}

export function EmptyState({ title, description, ctaLabel, ctaHref, icon = '📭' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      {ctaLabel && ctaHref && (
        <Button asChild>
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  );
}
