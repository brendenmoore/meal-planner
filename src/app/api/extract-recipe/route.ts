import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API Key not configured' }, { status: 500 });
    }

    const referer = process.env.OPENROUTER_REFERER || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const title = process.env.OPENROUTER_TITLE || 'Meal Planner';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': referer,
        'X-Title': title,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the recipe from this image. Return a JSON object strictly with the following structure: { "name": "Recipe Name", "ingredients": [{ "name": "Ingredient Name", "amount": "1 cup" }], "instructions": "Step 1: Do this.\\nStep 2: Do that." }'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      return NextResponse.json({ error: 'Failed to process image' }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const resultText = Array.isArray(content)
      ? content.map((part: any) => part?.text ?? '').join('')
      : content;
    
    if (!resultText) {
        return NextResponse.json({ error: 'No content returned from AI' }, { status: 500 });
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (e) {
       console.error('Failed to parse JSON', e);
       parsedResult = { name: 'Extracted Recipe', instructions: resultText, ingredients: [] };
    }

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
