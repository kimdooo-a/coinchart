import { NextResponse } from 'next/server';
import { fetchTags } from '@/lib/supabase/blog';

// GET /api/blog/tags - 태그 목록
export async function GET() {
  const tags = await fetchTags();

  return NextResponse.json(
    { tags },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}
