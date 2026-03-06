'use client';
import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { ContentBrief, ContentGap, BriefGenerationConfig } from '@/types';
import { localStore } from '@/lib/storage/localStore';
import { buildBriefPrompt } from '@/lib/claude/buildBriefPrompt';
import { buildRecommendations } from '@/lib/analysis/recommendationBuilder';

export function useSavedBriefs() {
  const [briefs, setBriefs] = useState<ContentBrief[]>(() => localStore.getBriefs());
  const [generating, setGenerating] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setBriefs(localStore.getBriefs());
  }, []);

  const generateBrief = useCallback(async (
    gap: ContentGap,
    config: BriefGenerationConfig,
  ): Promise<ContentBrief> => {
    const id = `brief-${Date.now()}-${gap.id.slice(0, 8)}`;

    const placeholder: ContentBrief = {
      id,
      createdAt: new Date().toISOString(),
      query: gap.query,
      productLine: gap.productLine,
      targetUrl: config.targetUrl,
      gap,
      competitors: gap.competitorsPresent,
      claudeModel: 'claude-sonnet-4-6',
      promptVersion: 'v1.0',
      briefMarkdown: '',
      status: 'generating',
    };

    localStore.saveBrief(placeholder);
    setBriefs(localStore.getBriefs());
    setGenerating(id);

    try {
      // Build a temporary recommendation for this gap
      const tempRecs = buildRecommendations([gap]);
      const recommendation = tempRecs.find(r => r.aceableUrl === config.targetUrl) ?? tempRecs[0] ?? null;

      const prompt = buildBriefPrompt({
        gap,
        recommendation,
        targetUrl: config.targetUrl,
        tone: config.tone,
        length: config.length,
        additionalContext: config.additionalContext,
      });

      const res = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error(`API error: ${res.statusText}`);

      const data = await res.json() as { brief: string; usage?: { input_tokens: number; output_tokens: number } };

      const completed: ContentBrief = {
        ...placeholder,
        briefMarkdown: data.brief,
        status: 'complete',
        tokenCount: data.usage ? data.usage.input_tokens + data.usage.output_tokens : undefined,
      };

      localStore.saveBrief(completed);
      setBriefs(localStore.getBriefs());
      return completed;

    } catch (err) {
      const failed: ContentBrief = { ...placeholder, status: 'error' };
      localStore.saveBrief(failed);
      setBriefs(localStore.getBriefs());
      throw err;
    } finally {
      setGenerating(null);
    }
  }, []);

  const deleteBrief = useCallback((id: string) => {
    localStore.deleteBrief(id);
    setBriefs(localStore.getBriefs());
  }, []);

  return { briefs, generating, generateBrief, deleteBrief, refresh };
}
