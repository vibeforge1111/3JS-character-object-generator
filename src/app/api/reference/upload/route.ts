import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { image, mimeType, filename } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Ensure reference directory exists
    const refDir = join(process.cwd(), 'public', 'reference');
    await mkdir(refDir, { recursive: true });

    // Remove data URL prefix and save
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Save as current reference image
    const ext = mimeType?.split('/')[1] || 'png';
    const filepath = join(refDir, `current.${ext}`);
    await writeFile(filepath, buffer);

    // Also save metadata for Claude Code to read
    const metaPath = join(refDir, 'current.json');
    await writeFile(metaPath, JSON.stringify({
      filename: filename || `reference.${ext}`,
      mimeType: mimeType || 'image/png',
      uploadedAt: new Date().toISOString(),
      status: 'pending_analysis',
      filepath: `/reference/current.${ext}`,
    }, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Image saved. Ask Claude Code to analyze it.',
      filepath: `/reference/current.${ext}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
