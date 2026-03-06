'use client';
import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  onFileAccepted: (file: File) => void;
  isProcessing: boolean;
}

export function DropZone({ onFileAccepted, isProcessing }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file.');
      return;
    }
    onFileAccepted(file);
  }, [onFileAccepted]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => !isProcessing && inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all
        ${dragOver ? 'border-[#DB306A] bg-[#DB306A]/5' : 'border-gray-200 hover:border-gray-300 bg-white'}
        ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={onInputChange}
        disabled={isProcessing}
      />
      <div className="text-4xl mb-4">📊</div>
      <p className="text-lg font-medium text-gray-700 mb-1">
        {isProcessing ? 'Processing...' : 'Drop your CSV file here'}
      </p>
      <p className="text-sm text-gray-500 mb-4">
        Supports Semrush AI Overviews and BrightEdge AI exports
      </p>
      <Button variant="outline" disabled={isProcessing} onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
        Browse Files
      </Button>
    </div>
  );
}
