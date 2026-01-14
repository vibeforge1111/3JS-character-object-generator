import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const RESULT_PATH = join(process.cwd(), 'public', 'reference', 'result.json');

// GET - Retrieve analysis result (polled by frontend)
export async function GET() {
  try {
    const data = await readFile(RESULT_PATH, 'utf-8');
    const result = JSON.parse(data);
    return NextResponse.json(result);
  } catch (error) {
    // No result yet
    return NextResponse.json({ status: 'pending' });
  }
}

// POST - Save analysis result (called by Claude Code via curl)
export async function POST(request: NextRequest) {
  try {
    const result = await request.json();

    // Save the result
    await writeFile(RESULT_PATH, JSON.stringify({
      status: 'complete',
      analyzedAt: new Date().toISOString(),
      config: result,
    }, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save result error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Save failed' },
      { status: 500 }
    );
  }
}

// DELETE - Clear result (reset for new analysis)
export async function DELETE() {
  try {
    await writeFile(RESULT_PATH, JSON.stringify({ status: 'pending' }));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: true }); // Ignore errors
  }
}
