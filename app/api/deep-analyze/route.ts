import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const { url, pageText, seoScore, llmScore, title, gscEntry, gscMeta, powerBiEntry, pbiMeta } = await req.json();

  if (!url || !pageText) {
    return NextResponse.json({ error: 'url and pageText are required' }, { status: 400 });
  }

  const gscPeriodNote = gscMeta
    ? ` (${gscMeta.type === 'comparison' ? 'period-over-period comparison' : 'date range'}: ${gscMeta.label})`
    : '';

  const gscContext = gscEntry
    ? `\nSearch Console Data for this URL${gscPeriodNote}:
- Organic clicks: ${gscEntry.clicks.toLocaleString()}
- Impressions: ${gscEntry.impressions.toLocaleString()}
- Average position: #${gscEntry.position.toFixed(1)}
- Click-through rate: ${(gscEntry.ctr * 100).toFixed(1)}%${gscMeta?.type === 'comparison' ? '\n(Note: these are delta values vs the prior period, not absolute totals)' : ''}`
    : '';

  const pbiPeriodNote = pbiMeta
    ? ` (${pbiMeta.type === 'comparison' ? 'period-over-period comparison' : 'date range'}: ${pbiMeta.label})`
    : '';

  const fmtGrowth = (g: number | undefined) =>
    g !== undefined ? ` (${g > 0 ? '+' : ''}${g.toFixed(1)}% vs prior period)` : '';

  const pbiContext = powerBiEntry
    ? `\nBusiness Performance Data${pbiPeriodNote}:
- Sessions: ${powerBiEntry.sessions?.toLocaleString() ?? 'N/A'}${fmtGrowth(powerBiEntry.sessionsGrowth)}
- Orders: ${powerBiEntry.conversions?.toLocaleString() ?? 'N/A'}${fmtGrowth(powerBiEntry.conversionsGrowth)}
- Sales: ${powerBiEntry.revenue ? `$${powerBiEntry.revenue.toLocaleString()}` : 'N/A'}${fmtGrowth(powerBiEntry.revenueGrowth)}
- Bounce rate: ${powerBiEntry.bounceRate !== undefined ? `${(powerBiEntry.bounceRate * 100).toFixed(1)}%` : 'N/A'}${fmtGrowth(powerBiEntry.bounceRateGrowth)}${powerBiEntry.cvr !== undefined ? `\n- CVR: ${(powerBiEntry.cvr * 100).toFixed(2)}%${fmtGrowth(powerBiEntry.cvrGrowth)}` : ''}${powerBiEntry.aov !== undefined ? `\n- AOV: $${powerBiEntry.aov.toLocaleString()}` : ''}`
    : '';

  const prompt = `You are an expert SEO strategist and AI content specialist. Analyze this page for its ability to rank in traditional Google search AND be cited by AI systems (ChatGPT, Perplexity, Google AI Overview, Claude).

**Page:** ${url}
**Title:** ${title ?? 'Unknown'}
**SEO Health Score:** ${seoScore}/100
**LLM Visibility Score:** ${llmScore}/100
${gscContext}${pbiContext}

**Page Content (first 3,000 characters):**
${pageText.slice(0, 3000)}

---

Provide a structured analysis with exactly these sections. Be specific — reference actual content from the page where possible:

## Content Quality Assessment
(2–3 sentences) How well does this content serve the user's primary intent? What critical information is missing or underdeveloped?

## Brand Clarity for AI Attribution
(2 sentences) How clearly is the brand (Aceable / AceableAgent) identified? Would an AI system confidently attribute a quote from this page to the brand, or is the attribution ambiguous?

## Answer Completeness
(2 sentences) Does this page directly answer the primary query it targets? What's the most important question a user would arrive with that goes unanswered?

## Top 3 Recommendations
(Numbered list, each with: what to do, why it helps both SEO + LLM, estimated effort)
1. ...
2. ...
3. ...

## Competitive Risk
(1–2 sentences) Based on the content signals, where are competitors most likely beating this page — both in traditional search rankings and in AI citation frequency?${gscEntry && gscEntry.position > 10 ? `

## Search Performance Priority
Given the current ranking position of #${gscEntry.position.toFixed(1)}, what is the single highest-impact change to move this page into the top 10 results?` : ''}${powerBiEntry && (powerBiEntry.revenue ?? 0) > 0 ? `

## Business Impact Note
This page drives $${powerBiEntry.revenue?.toLocaleString()} in revenue. Factor this into prioritization.` : ''}

Keep each section concise and actionable. No fluff.`;

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  return NextResponse.json({
    markdown: text,
    generatedAt: new Date().toISOString(),
    usage: message.usage,
  });
}
