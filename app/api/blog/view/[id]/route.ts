import { NextRequest, NextResponse } from 'next/server';
import { incrementViewCount } from '@/lib/supabase/blog';

// POST /api/blog/view/[id] - 조회수 증가
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await incrementViewCount(id);
  return NextResponse.json({ success: true });
}
