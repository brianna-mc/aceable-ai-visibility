import type { ContentBrief, UploadHistoryEntry, UserPreferences, GscPageEntry, PowerBiPageEntry, DataPeriodMeta } from '@/types';

const KEYS = {
  briefs: 'aceable_saved_briefs',
  uploadHistory: 'aceable_upload_history',
  preferences: 'aceable_preferences',
  gscData: 'aceable_gsc_data',
  powerBiData: 'aceable_powerbi_data',
  gscMeta: 'aceable_gsc_meta',
  pbiMeta: 'aceable_pbi_meta',
} as const;

const MAX_BRIEFS = 50;

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultProductFilter: 'all',
  briefTone: 'professional',
  briefLength: 'standard',
  dismissedOnboarding: false,
};

function safeWrite(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    console.error(`localStorage write failed for key: ${key}`);
  }
}

function safeRead<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

// Strip protocol, www, and trailing slash
function normalizeUrl(url: string): string {
  return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

// Extract just the pathname (handles both full URLs and path-only strings)
function urlPath(url: string): string {
  if (!url.startsWith('http')) return url.replace(/\/$/, '').toLowerCase();
  try { return new URL(url).pathname.replace(/\/$/, '').toLowerCase() || '/'; }
  catch { return url.replace(/\/$/, '').toLowerCase(); }
}

// Match by full normalized URL first, then by path alone (handles path-only PBI exports)
function matchUrl(candidate: string, target: string): boolean {
  const t = normalizeUrl(target);
  const tp = urlPath(target);
  const c = normalizeUrl(candidate);
  const cp = urlPath(candidate);
  return c === t || cp === tp;
}

export const localStore = {
  // ─── Briefs ──────────────────────────────────────────────────────────────────
  getBriefs: (): ContentBrief[] => safeRead<ContentBrief[]>(KEYS.briefs) ?? [],

  saveBrief: (brief: ContentBrief): void => {
    const existing = localStore.getBriefs();
    const withoutDuplicate = existing.filter(b => b.id !== brief.id);
    const updated = [brief, ...withoutDuplicate].slice(0, MAX_BRIEFS);
    safeWrite(KEYS.briefs, updated);
  },

  deleteBrief: (id: string): void => {
    const existing = localStore.getBriefs();
    safeWrite(KEYS.briefs, existing.filter(b => b.id !== id));
  },

  getBriefById: (id: string): ContentBrief | null => {
    return localStore.getBriefs().find(b => b.id === id) ?? null;
  },

  updateBriefStatus: (id: string, status: ContentBrief['status'], markdown?: string): void => {
    const briefs = localStore.getBriefs();
    const updated = briefs.map(b =>
      b.id === id ? { ...b, status, ...(markdown ? { briefMarkdown: markdown } : {}) } : b
    );
    safeWrite(KEYS.briefs, updated);
  },

  // ─── Upload History ───────────────────────────────────────────────────────────
  getUploadHistory: (): UploadHistoryEntry[] =>
    safeRead<UploadHistoryEntry[]>(KEYS.uploadHistory) ?? [],

  addUploadHistoryEntry: (entry: UploadHistoryEntry): void => {
    const existing = localStore.getUploadHistory();
    const updated = [entry, ...existing].slice(0, 20);
    safeWrite(KEYS.uploadHistory, updated);
  },

  // ─── GSC Data ─────────────────────────────────────────────────────────────────
  saveGscData: (entries: GscPageEntry[]): void => safeWrite(KEYS.gscData, entries),
  mergeGscData: (newEntries: GscPageEntry[]): void => {
    const existing = localStore.getGscData();
    const map = new Map(existing.map(e => [normalizeUrl(e.url), e]));
    for (const e of newEntries) map.set(normalizeUrl(e.url), e);
    safeWrite(KEYS.gscData, Array.from(map.values()));
  },
  getGscData: (): GscPageEntry[] => safeRead<GscPageEntry[]>(KEYS.gscData) ?? [],
  getGscEntry: (url: string): GscPageEntry | null =>
    localStore.getGscData().find(e => matchUrl(e.url, url)) ?? null,
  clearGscData: (): void => safeWrite(KEYS.gscData, []),

  // ─── Power BI Data ────────────────────────────────────────────────────────────
  savePowerBiData: (entries: PowerBiPageEntry[]): void => safeWrite(KEYS.powerBiData, entries),
  mergePowerBiData: (newEntries: PowerBiPageEntry[]): void => {
    const existing = localStore.getPowerBiData();
    const map = new Map(existing.map(e => [normalizeUrl(e.url), e]));
    for (const e of newEntries) map.set(normalizeUrl(e.url), e);
    safeWrite(KEYS.powerBiData, Array.from(map.values()));
  },
  getPowerBiData: (): PowerBiPageEntry[] => safeRead<PowerBiPageEntry[]>(KEYS.powerBiData) ?? [],
  getPowerBiEntry: (url: string): PowerBiPageEntry | null =>
    localStore.getPowerBiData().find(e => matchUrl(e.url, url)) ?? null,
  clearPowerBiData: (): void => safeWrite(KEYS.powerBiData, []),

  // ─── Period Metadata ──────────────────────────────────────────────────────────
  getGscMeta: (): DataPeriodMeta | null => safeRead<DataPeriodMeta>(KEYS.gscMeta),
  saveGscMeta: (meta: DataPeriodMeta): void => safeWrite(KEYS.gscMeta, meta),
  clearGscMeta: (): void => safeWrite(KEYS.gscMeta, null),

  getPbiMeta: (): DataPeriodMeta | null => safeRead<DataPeriodMeta>(KEYS.pbiMeta),
  savePbiMeta: (meta: DataPeriodMeta): void => safeWrite(KEYS.pbiMeta, meta),
  clearPbiMeta: (): void => safeWrite(KEYS.pbiMeta, null),

  // ─── Preferences ──────────────────────────────────────────────────────────────
  getPreferences: (): UserPreferences => ({
    ...DEFAULT_PREFERENCES,
    ...(safeRead<Partial<UserPreferences>>(KEYS.preferences) ?? {}),
  }),

  savePreferences: (prefs: Partial<UserPreferences>): void => {
    const current = localStore.getPreferences();
    safeWrite(KEYS.preferences, { ...current, ...prefs });
  },
};
