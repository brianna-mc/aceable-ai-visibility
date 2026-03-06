import type { RawPageSignals, ScoredItem } from '@/types';

export function scorePageSEO(s: RawPageSignals): { score: number; items: ScoredItem[] } {
  const items: ScoredItem[] = [];

  // Title tag present (10 pts)
  items.push(s.title
    ? { label: 'Title tag present', status: 'pass', points: 10, maxPoints: 10, detail: `"${s.title}"` }
    : { label: 'Title tag present', status: 'fail', points: 0, maxPoints: 10, detail: 'No <title> tag found — critical for SEO' });

  // Title length (5 pts)
  if (s.title) {
    const len = s.titleLength;
    if (len >= 50 && len <= 65) {
      items.push({ label: 'Title length', status: 'pass', points: 5, maxPoints: 5, detail: `${len} chars (ideal: 50–65)` });
    } else if (len > 65) {
      items.push({ label: 'Title length', status: 'warn', points: 2, maxPoints: 5, detail: `${len} chars — too long, Google will truncate (max 65)` });
    } else {
      items.push({ label: 'Title length', status: 'warn', points: 2, maxPoints: 5, detail: `${len} chars — too short, use 50–65 chars for best results` });
    }
  } else {
    items.push({ label: 'Title length', status: 'fail', points: 0, maxPoints: 5, detail: 'N/A (no title)' });
  }

  // Meta description present (10 pts)
  items.push(s.metaDescription
    ? { label: 'Meta description', status: 'pass', points: 10, maxPoints: 10, detail: `"${s.metaDescription.slice(0, 80)}…"` }
    : { label: 'Meta description', status: 'fail', points: 0, maxPoints: 10, detail: 'Missing — Google will auto-generate one, usually lower CTR' });

  // Meta description length (5 pts)
  if (s.metaDescription) {
    const len = s.metaDescriptionLength;
    if (len >= 130 && len <= 165) {
      items.push({ label: 'Meta description length', status: 'pass', points: 5, maxPoints: 5, detail: `${len} chars (ideal: 130–165)` });
    } else if (len > 165) {
      items.push({ label: 'Meta description length', status: 'warn', points: 2, maxPoints: 5, detail: `${len} chars — will be truncated in search results` });
    } else {
      items.push({ label: 'Meta description length', status: 'warn', points: 2, maxPoints: 5, detail: `${len} chars — too short, leaves CTR value on the table` });
    }
  } else {
    items.push({ label: 'Meta description length', status: 'fail', points: 0, maxPoints: 5, detail: 'N/A (no meta description)' });
  }

  // H1 (10 pts)
  if (s.h1Count === 1) {
    items.push({ label: 'H1 heading', status: 'pass', points: 10, maxPoints: 10, detail: `"${s.h1Text ?? ''}"` });
  } else if (s.h1Count === 0) {
    items.push({ label: 'H1 heading', status: 'fail', points: 0, maxPoints: 10, detail: 'No H1 found — every page needs exactly one H1' });
  } else {
    items.push({ label: 'H1 heading', status: 'warn', points: 5, maxPoints: 10, detail: `${s.h1Count} H1 tags found — should have exactly one` });
  }

  // H2/H3 structure (10 pts)
  const subheadings = s.h2Count + s.h3Count;
  if (subheadings >= 4) {
    items.push({ label: 'Subheading structure', status: 'pass', points: 10, maxPoints: 10, detail: `${s.h2Count} H2s, ${s.h3Count} H3s — well-structured` });
  } else if (subheadings >= 2) {
    items.push({ label: 'Subheading structure', status: 'warn', points: 5, maxPoints: 10, detail: `${subheadings} subheadings — add more H2/H3s to improve structure and scannability` });
  } else {
    items.push({ label: 'Subheading structure', status: 'fail', points: 0, maxPoints: 10, detail: 'Fewer than 2 subheadings — poor structure hurts SEO and readability' });
  }

  // Word count (10 pts base + 5 bonus)
  if (s.wordCount >= 1500) {
    items.push({ label: 'Content depth', status: 'pass', points: 15, maxPoints: 15, detail: `${s.wordCount.toLocaleString()} words — excellent depth` });
  } else if (s.wordCount >= 800) {
    items.push({ label: 'Content depth', status: 'pass', points: 10, maxPoints: 15, detail: `${s.wordCount.toLocaleString()} words — good, aim for 1,500+ to compete on tough keywords` });
  } else if (s.wordCount >= 400) {
    items.push({ label: 'Content depth', status: 'warn', points: 4, maxPoints: 15, detail: `${s.wordCount.toLocaleString()} words — thin content, minimum 800 words recommended` });
  } else {
    items.push({ label: 'Content depth', status: 'fail', points: 0, maxPoints: 15, detail: `${s.wordCount.toLocaleString()} words — very thin, Google may not rank this page` });
  }

  // Schema markup (10 pts)
  if (s.schemaTypes.length > 0) {
    items.push({ label: 'Schema markup', status: 'pass', points: 10, maxPoints: 10, detail: `Found: ${s.schemaTypes.join(', ')}` });
  } else {
    items.push({ label: 'Schema markup', status: 'fail', points: 0, maxPoints: 10, detail: 'No JSON-LD schema found — add Course, FAQPage, or HowTo markup' });
  }

  // Internal links (10 pts)
  if (s.internalLinkCount >= 5) {
    items.push({ label: 'Internal links', status: 'pass', points: 10, maxPoints: 10, detail: `${s.internalLinkCount} internal links found` });
  } else if (s.internalLinkCount >= 3) {
    items.push({ label: 'Internal links', status: 'pass', points: 7, maxPoints: 10, detail: `${s.internalLinkCount} internal links — aim for 5+ to stronger pass link equity` });
  } else if (s.internalLinkCount >= 1) {
    items.push({ label: 'Internal links', status: 'warn', points: 3, maxPoints: 10, detail: `${s.internalLinkCount} internal links — low, add more to help Google discover related pages` });
  } else {
    items.push({ label: 'Internal links', status: 'fail', points: 0, maxPoints: 10, detail: 'No internal links detected — critical for crawlability and authority flow' });
  }

  // Canonical tag (5 pts)
  items.push(s.hasCanonical
    ? { label: 'Canonical tag', status: 'pass', points: 5, maxPoints: 5, detail: 'Canonical tag present — prevents duplicate content issues' }
    : { label: 'Canonical tag', status: 'warn', points: 0, maxPoints: 5, detail: 'No canonical tag — add one to prevent potential duplicate content issues' });

  // FAQ section (5 pts)
  items.push(s.hasFaqSection
    ? { label: 'FAQ section', status: 'pass', points: 5, maxPoints: 5, detail: 'FAQ section detected — eligible for Google FAQ rich results' }
    : { label: 'FAQ section', status: 'warn', points: 0, maxPoints: 5, detail: 'No FAQ section — a Q&A section can earn featured snippets and FAQ rich results' });

  const score = Math.min(100, items.reduce((sum, i) => sum + i.points, 0));
  return { score, items };
}

export function scoreLLMVisibility(s: RawPageSignals): { score: number; items: ScoredItem[] } {
  const items: ScoredItem[] = [];

  // Brand name in first 200 words (15 pts)
  if (s.brandMentionsFirst200Words >= 2) {
    items.push({ label: 'Brand name appears early', status: 'pass', points: 15, maxPoints: 15, detail: `${s.brandMentionsFirst200Words}× in first 200 words — strong attribution signal` });
  } else if (s.brandMentionsFirst200Words === 1) {
    items.push({ label: 'Brand name appears early', status: 'pass', points: 10, maxPoints: 15, detail: '1× in first 200 words — good, add another mention for stronger attribution' });
  } else {
    items.push({ label: 'Brand name appears early', status: 'fail', points: 0, maxPoints: 15, detail: 'Brand name not found in first 200 words — AI systems may not attribute this page correctly' });
  }

  // Brand name total (10 pts)
  if (s.brandMentionsTotal >= 5) {
    items.push({ label: 'Brand name frequency', status: 'pass', points: 10, maxPoints: 10, detail: `${s.brandMentionsTotal} total mentions — strong` });
  } else if (s.brandMentionsTotal >= 3) {
    items.push({ label: 'Brand name frequency', status: 'pass', points: 7, maxPoints: 10, detail: `${s.brandMentionsTotal} total mentions — adequate` });
  } else if (s.brandMentionsTotal >= 1) {
    items.push({ label: 'Brand name frequency', status: 'warn', points: 3, maxPoints: 10, detail: `${s.brandMentionsTotal} total mentions — low, aim for 3–5 natural mentions` });
  } else {
    items.push({ label: 'Brand name frequency', status: 'fail', points: 0, maxPoints: 10, detail: 'Brand name not found — AI systems cannot attribute this content to Aceable' });
  }

  // Quick-answer block (15 pts)
  items.push(s.hasQuickAnswerBlock
    ? { label: 'Quick-answer block at top', status: 'pass', points: 15, maxPoints: 15, detail: 'Direct answer detected near top of page — high LLM citation potential' }
    : { label: 'Quick-answer block at top', status: 'fail', points: 0, maxPoints: 15, detail: 'No concise answer block found near top — AI systems prefer pages that lead with a direct answer' });

  // FAQ section (15 pts)
  items.push(s.hasFaqSection
    ? { label: 'FAQ section', status: 'pass', points: 15, maxPoints: 15, detail: 'FAQ section found — structured Q&A is heavily cited by AI systems' }
    : { label: 'FAQ section', status: 'fail', points: 0, maxPoints: 15, detail: 'No FAQ section — add one to dramatically increase AI citation frequency' });

  // FAQPage/HowTo/Course schema (15 pts)
  const llmSchemas = ['FAQPage', 'HowTo', 'Course', 'EducationalOrganization', 'ItemList'];
  const matchedSchemas = s.schemaTypes.filter(t => llmSchemas.includes(t));
  if (matchedSchemas.length > 0) {
    items.push({ label: 'LLM-friendly schema', status: 'pass', points: 15, maxPoints: 15, detail: `${matchedSchemas.join(', ')} schema found — AI systems use structured data for confident citations` });
  } else if (s.schemaTypes.length > 0) {
    items.push({ label: 'LLM-friendly schema', status: 'warn', points: 5, maxPoints: 15, detail: `Schema found (${s.schemaTypes.join(', ')}) but not FAQPage/HowTo/Course — add LLM-optimized types` });
  } else {
    items.push({ label: 'LLM-friendly schema', status: 'fail', points: 0, maxPoints: 15, detail: 'No structured data — FAQPage or HowTo schema can 3× citation rate on informational queries' });
  }

  // Lists (10 pts)
  if (s.listCount >= 3) {
    items.push({ label: 'Lists (bullets/numbered)', status: 'pass', points: 10, maxPoints: 10, detail: `${s.listCount} lists found — AI systems prefer quoting structured list content` });
  } else if (s.listCount >= 1) {
    items.push({ label: 'Lists (bullets/numbered)', status: 'warn', points: 5, maxPoints: 10, detail: `${s.listCount} list(s) — add more bulleted or numbered lists to improve AI scannability` });
  } else {
    items.push({ label: 'Lists (bullets/numbered)', status: 'fail', points: 0, maxPoints: 10, detail: 'No lists found — AI models strongly prefer citing page content structured as lists' });
  }

  // Stats/numeric data (10 pts)
  if (s.statsCount >= 5) {
    items.push({ label: 'Statistics & data points', status: 'pass', points: 10, maxPoints: 10, detail: `${s.statsCount} numeric data points found — excellent citation fodder` });
  } else if (s.statsCount >= 3) {
    items.push({ label: 'Statistics & data points', status: 'pass', points: 7, maxPoints: 10, detail: `${s.statsCount} stats found — good, AI systems use these as quotable evidence` });
  } else if (s.statsCount >= 1) {
    items.push({ label: 'Statistics & data points', status: 'warn', points: 3, maxPoints: 10, detail: `${s.statsCount} stats found — add more specific figures (pass rates, costs, time to complete)` });
  } else {
    items.push({ label: 'Statistics & data points', status: 'fail', points: 0, maxPoints: 10, detail: 'No statistics found — add specific figures; LLMs strongly prefer citable numerical claims' });
  }

  // Content depth for LLM (10 pts)
  if (s.wordCount >= 1000) {
    items.push({ label: 'Content depth for AI', status: 'pass', points: 10, maxPoints: 10, detail: `${s.wordCount.toLocaleString()} words — sufficient depth for AI citation` });
  } else if (s.wordCount >= 500) {
    items.push({ label: 'Content depth for AI', status: 'warn', points: 5, maxPoints: 10, detail: `${s.wordCount.toLocaleString()} words — borderline, AI systems rarely cite very thin pages` });
  } else {
    items.push({ label: 'Content depth for AI', status: 'fail', points: 0, maxPoints: 10, detail: `${s.wordCount.toLocaleString()} words — too thin for AI citation` });
  }

  const score = Math.min(100, items.reduce((sum, i) => sum + i.points, 0));
  return { score, items };
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-green-600' };
  if (score >= 60) return { label: 'Good', color: 'text-teal-600' };
  if (score >= 40) return { label: 'Needs Work', color: 'text-amber-600' };
  return { label: 'Poor', color: 'text-red-600' };
}
