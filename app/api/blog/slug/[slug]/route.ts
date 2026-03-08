import { NextRequest, NextResponse } from 'next/server';
import { fetchPostBySlug } from '@/lib/supabase/blog';

// GET /api/blog/slug/[slug] - slug로 발행 포스트 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json(
    { post },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    }
  );
}
