import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchPostById,
  updatePost,
  deletePost,
  isAdminEmail,
} from '@/lib/supabase/blog';

// GET /api/blog/[id] - 포스트 상세 (Admin, draft 포함)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const post = await fetchPostById(id);

  if (!post) {
    return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ post });
}

// PUT /api/blog/[id] - 포스트 수정 (Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const post = await updatePost(id, body);

  if (!post) {
    return NextResponse.json(
      { error: '포스트 수정에 실패했습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ post });
}

// DELETE /api/blog/[id] - 포스트 삭제 (Admin)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const success = await deletePost(id);

  if (!success) {
    return NextResponse.json(
      { error: '포스트 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
