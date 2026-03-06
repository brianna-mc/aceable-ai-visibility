import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, model = 'claude-sonnet-4-6', maxTokens = 4000 } = await req.json() as {
    prompt: string;
    model?: string;
    maxTokens?: number;
  };

  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  return NextResponse.json({
    brief: text,
    model: message.model,
    usage: message.usage,
  });
}
