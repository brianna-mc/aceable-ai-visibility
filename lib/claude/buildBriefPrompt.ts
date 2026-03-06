import type { ContentGap, PageRecommendation, ProductLine, UserPreferences } from '@/types';

interface BriefPromptInput {
  gap: ContentGap;
  recommendation: PageRecommendation | null;
  targetUrl: string;
  tone: UserPreferences['briefTone'];
  length: UserPreferences['briefLength'];
  additionalContext?: string;
}

const PRODUCT_CONTEXT: Record<ProductLine, string> = {
  aceableagent: `AceableAgent (aceableagent.com) is an online real estate pre-licensing school approved in Texas (TREC), Florida (FREC), Georgia, Michigan, North Carolina, and other states. Differentiators: mobile-first learning via app, sleek UX, money-back guarantee, and state exam pass guarantee. Pricing is typically lower than competitors like The CE Shop or Champions School.`,

  drivers_ed: `Aceable Drivers Ed (aceable.com/drivers-ed) is a state-approved online driver's education provider for teens and adults. It's TDLR-approved in Texas and similarly approved in other states. Fully mobile and app-based. Competitors include DriversEd.com, iDriveSafely, and Virtual Drive of Texas.`,

  defensive_driving: `Aceable Defensive Driving (aceable.com/defensive-driving) is a court-approved and insurance-approved online traffic school in Texas and other states. Fully mobile, self-paced, no time restrictions. Competitors include iDriveSafely, Improv Traffic School, and Comedy Driving.`,

  unknown: `Aceable is an online education company with products in real estate licensing (AceableAgent), driver's education, and defensive driving.`,
};

const LENGTH_INSTRUCTIONS: Record<UserPreferences['briefLength'], string> = {
  concise: 'Keep the total brief to ~600–800 words. Focus only on the 3 highest-impact recommendations.',
  standard: 'Target 1,200–1,800 words. Cover all required sections with appropriate depth.',
  comprehensive: 'Target 2,500–3,500 words. Include full H2/H3 outline, extended FAQ section, and detailed internal linking strategy.',
};

const TONE_INSTRUCTIONS: Record<UserPreferences['briefTone'], string> = {
  professional: 'Use a professional, direct tone appropriate for a B2C education brand. Clear and authoritative. Avoid jargon.',
  conversational: 'Use a friendly, approachable tone. Write as if advising a colleague. Use contractions and accessible language.',
  technical: 'Use a precise, data-driven tone. Include specific SEO technical recommendations where relevant. Mention schema types, heading hierarchy, etc.',
};

export function buildBriefPrompt({
  gap,
  recommendation,
  targetUrl,
  tone,
  length,
  additionalContext,
}: BriefPromptInput): string {
  const actions = recommendation?.recommendedActions ?? [];
  const competitorList = gap.competitorsPresent.join(', ') || 'unknown competitors';

  return `You are a senior SEO content strategist specializing in LLM search visibility — specifically how to get brands cited in AI-generated answers from ChatGPT, Google AI Overviews, Perplexity, and similar tools.

## Your Task
Generate a complete content brief for the Aceable page listed below. The goal is to improve this page so that when AI systems answer the target query, they cite Aceable instead of (or in addition to) the competitors currently being cited.

## Brand Context
${PRODUCT_CONTEXT[gap.productLine]}

## Target Page
URL: ${targetUrl}
Product Line: ${gap.productLine.replace('_', ' ')}

## The Content Gap
- Target Query: "${gap.query}"
- Monthly Search Volume: ${gap.searchVolume?.toLocaleString() ?? 'Unknown'}
- Query Intent: ${gap.queryIntent}
- Current AI Citation Status: **Aceable is NOT being cited for this query**
- Competitors Currently Cited in AI Responses: ${competitorList}

## Recommended Actions to Address
${actions.length > 0
    ? actions.map((a, i) => `${i + 1}. [${a.type}] ${a.description}`).join('\n')
    : '1. Add explicit brand mentions with relevant context\n2. Add FAQ content addressing the query\n3. Add citation-worthy statistics or claims'}

${additionalContext ? `## Additional Context from the SEO Team\n${additionalContext}\n` : ''}

## Output Format Requirements
${LENGTH_INSTRUCTIONS[length]}
${TONE_INSTRUCTIONS[tone]}

---

Produce the content brief in this exact markdown structure:

# Content Brief: [Descriptive Page Title]

## Executive Summary
[2–3 sentences: what this brief accomplishes and why it matters for LLM visibility]

## Why Aceable Is Missing From AI Responses
[Explain the specific gap: what signals AI systems use to evaluate citation-worthiness, and what this page currently lacks — authoritativeness, explicit brand mentions, structured data signals, clear factual claims, etc.]

## Target Query Analysis
- **Primary Query:** ${gap.query}
- **Intent:** ${gap.queryIntent}
- **How AI Interprets This Query:** [What AI systems look for in a source when answering this]
- **Why Competitors Are Cited:** [Be specific about what The CE Shop / iDriveSafely / etc. have that this page lacks]

## Content Recommendations

### 1. [Recommendation Title]
**What to add or change:** [Specific instruction]
**Why this improves LLM citation:** [Mechanism explanation — what signal does this send to AI systems]
**Suggested copy (ready to paste):**
> [2–4 sentences of example copy that explicitly names Aceable and addresses the query]

[Repeat for each recommendation — minimum 3, maximum 6]

## Proposed Page Metadata
- **H1 (Page Title):** [Proposed title]
- **Meta Title (≤60 chars):** [Meta title]
- **Meta Description (≤155 chars):** [Meta description that mentions Aceable by name]

## Suggested FAQ Section
[3–5 Q&A pairs that directly address the target query. Structure them to be pulled verbatim into AI responses. Aceable must be named explicitly in each answer.]

**Q: [Question]**
A: [2–4 sentence answer that names Aceable, gives a specific fact or differentiator, and links the reader to take action]

## Schema Markup Recommendation
[Specify FAQPage, HowTo, Review, or Course schema. Explain which is most appropriate and provide a brief JSON-LD example for the most critical property.]

## Internal Linking Opportunities
[2–3 specific internal links to add: anchor text → target URL]

## Success Metrics
[How to measure if this brief worked: which Semrush AI Overviews or BrightEdge metrics to watch, and what improvement to expect in 60–90 days]

---
*Generated by Aceable LLM Visibility Dashboard | claude-sonnet-4-6 | Prompt v1.0*`;
}
