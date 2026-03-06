'use client';
import type { DataSource } from '@/types';
import { Button } from '@/components/ui/button';

interface Props {
  detected: DataSource | null;
  fileName: string;
  onOverride: (source: DataSource) => void;
}

const SOURCE_LABELS: Record<DataSource, string> = {
  semrush: 'Semrush AI Overviews',
  brightedge: 'BrightEdge AI',
};

export function FormatBanner({ detected, fileName, onOverride }: Props) {
  if (!detected) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm font-medium text-amber-800 mb-1">Format not recognized for: {fileName}</p>
        <p className="text-xs text-amber-700 mb-3">
          We couldn&apos;t detect the file format automatically. Please select one:
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onOverride('semrush')}>
            Semrush AI Overviews
          </Button>
          <Button size="sm" variant="outline" onClick={() => onOverride('brightedge')}>
            BrightEdge AI
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-green-800">
          Detected: {SOURCE_LABELS[detected]}
        </p>
        <p className="text-xs text-green-700">{fileName}</p>
      </div>
      <div className="flex gap-2">
        {(['semrush', 'brightedge'] as DataSource[])
          .filter(s => s !== detected)
          .map(s => (
            <Button key={s} size="sm" variant="ghost" className="text-xs text-green-700" onClick={() => onOverride(s)}>
              Not {SOURCE_LABELS[s]}? Switch
            </Button>
          ))}
      </div>
    </div>
  );
}
