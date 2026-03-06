import type { NormalizedRow, ParseError } from '@/types';
import { ProductBadge } from '@/components/shared/ProductBadge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

interface Props {
  rows: NormalizedRow[];
  parseErrors: ParseError[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ParsePreviewTable({ rows, parseErrors, onConfirm, onCancel }: Props) {
  const preview = rows.slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{rows.length} rows ready to import</p>
          {parseErrors.length > 0 && (
            <p className="text-xs text-amber-600">{parseErrors.length} parsing warnings</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={onConfirm}>Import {rows.length} Rows</Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-auto max-h-72">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Query</TableHead>
              <TableHead className="text-xs">Product</TableHead>
              <TableHead className="text-xs">Volume</TableHead>
              <TableHead className="text-xs">Has AI Response</TableHead>
              <TableHead className="text-xs">Intent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map(row => (
              <TableRow key={row.id}>
                <TableCell className="text-xs max-w-[250px] truncate">{row.query}</TableCell>
                <TableCell><ProductBadge productLine={row.productLine} size="sm" /></TableCell>
                <TableCell className="text-xs">{row.searchVolume?.toLocaleString() ?? '—'}</TableCell>
                <TableCell className="text-xs">{row.hasAiOverview ? '✓' : '—'}</TableCell>
                <TableCell className="text-xs capitalize">{row.queryIntent}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {rows.length > 10 && (
        <p className="text-xs text-gray-400 text-center">Showing 10 of {rows.length} rows</p>
      )}
    </div>
  );
}
