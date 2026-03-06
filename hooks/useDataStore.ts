'use client';
import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { NormalizedRow, BrandMention, ContentGap, PageRecommendation, DataSource, ParseError } from '@/types';
import { sessionStore, type SessionMeta } from '@/lib/storage/sessionStore';
import { localStore } from '@/lib/storage/localStore';
import { analyzeRows } from '@/lib/analysis/mentionDetector';
import { findGaps } from '@/lib/analysis/gapFinder';
import { buildRecommendations } from '@/lib/analysis/recommendationBuilder';

export interface DataStoreState {
  rows: NormalizedRow[];
  mentions: BrandMention[];
  gaps: ContentGap[];
  recommendations: PageRecommendation[];
  sessionMeta: SessionMeta | null;
  isProcessing: boolean;
  parseErrors: ParseError[];
  hasData: boolean;
}

export function useDataStore() {
  const [state, setState] = useState<DataStoreState>(() => ({
    rows: sessionStore.getRows(),
    mentions: sessionStore.getMentions(),
    gaps: sessionStore.getGaps(),
    recommendations: sessionStore.getRecommendations(),
    sessionMeta: sessionStore.getMeta(),
    isProcessing: false,
    parseErrors: [],
    hasData: sessionStore.hasData(),
  }));

  const loadUploadedData = useCallback((
    rows: NormalizedRow[],
    errors: ParseError[],
    fileName: string,
    source: DataSource,
  ) => {
    setState(s => ({ ...s, isProcessing: true }));

    // Run analysis pipeline
    const mentions = analyzeRows(rows);
    const gaps = findGaps(mentions);
    const recommendations = buildRecommendations(gaps);

    const meta: SessionMeta = {
      fileName,
      source,
      rowCount: rows.length,
      uploadedAt: new Date().toISOString(),
    };

    // Persist to sessionStorage
    sessionStore.saveRows(rows);
    sessionStore.saveMentions(mentions);
    sessionStore.saveGaps(gaps);
    sessionStore.saveRecommendations(recommendations);
    sessionStore.saveMeta(meta);

    // Add to upload history in localStorage
    localStore.addUploadHistoryEntry({
      id: uuid(),
      fileName,
      source,
      uploadedAt: meta.uploadedAt,
      rowCount: rows.length,
    });

    setState({
      rows,
      mentions,
      gaps,
      recommendations,
      sessionMeta: meta,
      isProcessing: false,
      parseErrors: errors,
      hasData: true,
    });
  }, []);

  const clearData = useCallback(() => {
    sessionStore.clear();
    setState({
      rows: [],
      mentions: [],
      gaps: [],
      recommendations: [],
      sessionMeta: null,
      isProcessing: false,
      parseErrors: [],
      hasData: false,
    });
  }, []);

  return { ...state, loadUploadedData, clearData };
}
