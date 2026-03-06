'use client';
import { useState, useEffect } from 'react';
import type { ContentGap, BriefGenerationConfig, UserPreferences } from '@/types';
import { localStore } from '@/lib/storage/localStore';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

interface Props {
  gap: ContentGap;
  isOpen: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onGenerate: (config: BriefGenerationConfig) => Promise<void>;
}

export function BriefGeneratorModal({ gap, isOpen, isGenerating, onClose, onGenerate }: Props) {
  const [tone, setTone] = useState<UserPreferences['briefTone']>('professional');
  const [length, setLength] = useState<UserPreferences['briefLength']>('standard');

  useEffect(() => {
    const prefs = localStore.getPreferences();
    setTone(prefs.briefTone);
    setLength(prefs.briefLength);
  }, []);
  const [targetUrl, setTargetUrl] = useState(gap.suggestedAceableUrl ?? '');
  const [additionalContext, setAdditionalContext] = useState('');

  const handleGenerate = async () => {
    await onGenerate({ tone, length, targetUrl, additionalContext });
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Content Brief</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Target Query</p>
            <p className="text-sm font-medium text-gray-800 bg-gray-50 rounded px-3 py-2">{gap.query}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Target Page URL</label>
            <Input
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              placeholder="https://www.aceableagent.com/..."
              className="text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">The page this brief is for. We auto-suggested the best match.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Tone</label>
              <Select value={tone} onValueChange={v => setTone(v as typeof tone)}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Length</label>
              <Select value={length} onValueChange={v => setLength(v as typeof length)}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise (~700w)</SelectItem>
                  <SelectItem value="standard">Standard (~1500w)</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive (~3000w)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Additional context for Claude (optional)</label>
            <textarea
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              placeholder="e.g. We launched a new pricing page last month. Emphasize our pass guarantee."
              className="w-full text-sm border rounded-md px-3 py-2 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-[#DB306A]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>Cancel</Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !targetUrl}
            className="bg-[#DB306A] hover:bg-[#C22660] text-white"
          >
            {isGenerating ? 'Generating...' : 'Generate Brief'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
