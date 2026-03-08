import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchPublishedPosts,
  createPost,
  isAdminEmail,
} from '@/lib/supabase/blog';

// GET /api/blog - 발행 포스트 목록
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const category = searchParams.get('category') || undefined;
  const tag = searchParams.get('tag') || undefined;
  const lang = (searchParams.get('lang') as 'ko' | 'en') || undefined;

  const { posts, total } = await fetchPublishedPosts({
    page,
    limit,
    category,
    tag,
    lang,
  });

  return NextResponse.json(
    { posts, total, page, limit },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=59',
      },
    }
  );
}

// POST /api/blog - 포스트 생성 (Admin)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.title || !body.content) {
    return NextResponse.json(
      { error: '제목과 내용은 필수입니다.' },
      { status: 400 }
    );
  }

  const post = await createPost(user.id, body);

  if (!post) {
    return NextResponse.json(
      { error: '포스트 생성에 실패했습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ post }, { status: 201 });
}
