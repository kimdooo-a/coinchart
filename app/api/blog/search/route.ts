import { NextRequest, NextResponse } from 'next/server';
import { searchPosts } from '@/lib/supabase/blog';

// GET /api/blog/search - 전문 검색
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');

  if (!query.trim()) {
    return NextResponse.json({ posts: [], total: 0, page, limit });
  }

  const { posts, total } = await searchPosts(query, { page, limit });

  return NextResponse.json(
    { posts, total, page, limit },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    }
  );
}
