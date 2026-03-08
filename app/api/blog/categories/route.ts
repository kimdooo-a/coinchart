import { NextResponse } from 'next/server';
import { fetchCategories } from '@/lib/supabase/blog';

// GET /api/blog/categories - 카테고리 목록
export async function GET() {
  const categories = await fetchCategories();

  return NextResponse.json(
    { categories },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}
