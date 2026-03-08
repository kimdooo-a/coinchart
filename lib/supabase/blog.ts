// ====================================================
// BLOG SSOT (Single Source of Truth)
// blog_posts, blog_categories, blog_tags 접근 전용
// DO NOT import crypto or stock functions from here
// ====================================================

import { createAdminClient } from '@/lib/supabase/admin';
import type {
  BlogPost,
  BlogPostInput,
  BlogPostListOptions,
  BlogCategory,
  BlogTag,
  BlogSearchOptions,
} from '@/types/blog';

const ADMIN_EMAIL = 'smartkdy7@gmail.com';

// slug 생성 유틸
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)
    + '-' + Date.now().toString(36);
}

// ====================================================
// 카테고리
// ====================================================
export async function fetchCategories(): Promise<BlogCategory[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[Blog SSOT] fetchCategories error:', error);
    return [];
  }
  return data || [];
}

// ====================================================
// 태그
// ====================================================
export async function fetchTags(): Promise<BlogTag[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('blog_tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('[Blog SSOT] fetchTags error:', error);
    return [];
  }
  return data || [];
}

export async function createTag(name: string): Promise<BlogTag | null> {
  const supabase = createAdminClient();
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣-]/g, '');

  const { data, error } = await supabase
    .from('blog_tags')
    .upsert({ name, slug }, { onConflict: 'slug' })
    .select()
    .single();

  if (error) {
    console.error('[Blog SSOT] createTag error:', error);
    return null;
  }
  return data;
}

// ====================================================
// 개별 카테고리/태그 조회 (slug 기반)
// ====================================================
export async function fetchCategoryBySlug(slug: string): Promise<BlogCategory | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as BlogCategory;
}

export async function fetchTagBySlug(slug: string): Promise<BlogTag | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('blog_tags')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as BlogTag;
}

// ====================================================
// 포스트 조회 (공개)
// ====================================================
export async function fetchPublishedPosts(
  options: BlogPostListOptions = {}
): Promise<{ posts: BlogPost[]; total: number }> {
  const { page = 1, limit = 12, category, tag, lang } = options;
  const supabase = createAdminClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('blog_posts')
    .select('*, category:blog_categories(*)', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (lang) {
    query = query.eq('language', lang);
  }

  if (category) {
    // category slug로 category_id 찾기
    const { data: cat } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', category)
      .single();
    if (cat) {
      query = query.eq('category_id', cat.id);
    }
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[Blog SSOT] fetchPublishedPosts error:', error);
    return { posts: [], total: 0 };
  }

  let posts = (data || []) as BlogPost[];

  // 태그 필터 (post_tags join)
  if (tag) {
    const { data: tagData } = await supabase
      .from('blog_tags')
      .select('id')
      .eq('slug', tag)
      .single();

    if (tagData) {
      const { data: postIds } = await supabase
        .from('blog_post_tags')
        .select('post_id')
        .eq('tag_id', tagData.id);

      const ids = (postIds || []).map((p) => p.post_id);
      posts = posts.filter((p) => ids.includes(p.id));
    }
  }

  // 각 포스트의 태그 조회
  for (const post of posts) {
    post.tags = await fetchPostTags(post.id);
  }

  return { posts, total: count || 0 };
}

export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, category:blog_categories(*)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) {
    console.error('[Blog SSOT] fetchPostBySlug error:', error);
    return null;
  }

  const post = data as BlogPost;
  post.tags = await fetchPostTags(post.id);
  return post;
}

export async function fetchPostById(id: string): Promise<BlogPost | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, category:blog_categories(*)')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('[Blog SSOT] fetchPostById error:', error);
    return null;
  }

  const post = data as BlogPost;
  post.tags = await fetchPostTags(post.id);
  return post;
}

// 포스트의 태그 목록 조회
async function fetchPostTags(postId: string): Promise<BlogTag[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('blog_post_tags')
    .select('tag_id, tag:blog_tags(*)')
    .eq('post_id', postId);

  if (error || !data) return [];
  return data.map((row) => (row as unknown as { tag: BlogTag }).tag).filter(Boolean);
}

// ====================================================
// 포스트 관리 (Admin)
// ====================================================
export async function fetchAllPosts(): Promise<BlogPost[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, category:blog_categories(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Blog SSOT] fetchAllPosts error:', error);
    return [];
  }

  return (data || []) as BlogPost[];
}

export async function createPost(
  authorId: string,
  input: BlogPostInput
): Promise<BlogPost | null> {
  const supabase = createAdminClient();
  const slug = input.slug || generateSlug(input.title);

  const postData = {
    author_id: authorId,
    title: input.title,
    slug,
    content: input.content,
    excerpt: input.excerpt || null,
    featured_image: input.featured_image || null,
    category_id: input.category_id || null,
    status: input.status || 'draft',
    language: input.language || 'ko',
    meta_title: input.meta_title || null,
    meta_description: input.meta_description || null,
    published_at: input.status === 'published' ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('blog_posts')
    .insert(postData)
    .select()
    .single();

  if (error || !data) {
    console.error('[Blog SSOT] createPost error:', error);
    return null;
  }

  // 태그 연결
  if (input.tags && input.tags.length > 0) {
    await syncPostTags(data.id, input.tags);
  }

  return data as BlogPost;
}

export async function updatePost(
  id: string,
  input: Partial<BlogPostInput>
): Promise<BlogPost | null> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.slug !== undefined) updateData.slug = input.slug;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
  if (input.featured_image !== undefined) updateData.featured_image = input.featured_image;
  if (input.category_id !== undefined) updateData.category_id = input.category_id;
  if (input.status !== undefined) {
    updateData.status = input.status;
    if (input.status === 'published') {
      // 발행 시각이 없으면 현재 시각 설정
      const existing = await fetchPostById(id);
      if (existing && !existing.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }
  }
  if (input.language !== undefined) updateData.language = input.language;
  if (input.meta_title !== undefined) updateData.meta_title = input.meta_title;
  if (input.meta_description !== undefined) updateData.meta_description = input.meta_description;

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('[Blog SSOT] updatePost error:', error);
    return null;
  }

  // 태그 동기화
  if (input.tags !== undefined) {
    await syncPostTags(id, input.tags);
  }

  return data as BlogPost;
}

export async function deletePost(id: string): Promise<boolean> {
  const supabase = createAdminClient();

  // 태그 연결 먼저 삭제
  await supabase.from('blog_post_tags').delete().eq('post_id', id);

  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Blog SSOT] deletePost error:', error);
    return false;
  }
  return true;
}

// 태그 동기화: 이름 배열로 태그 생성 + 연결
async function syncPostTags(postId: string, tagNames: string[]): Promise<void> {
  const supabase = createAdminClient();

  // 기존 태그 연결 삭제
  await supabase.from('blog_post_tags').delete().eq('post_id', postId);

  for (const name of tagNames) {
    const tag = await createTag(name.trim());
    if (tag) {
      await supabase
        .from('blog_post_tags')
        .insert({ post_id: postId, tag_id: tag.id });
    }
  }
}

// ====================================================
// 조회수
// ====================================================
export async function incrementViewCount(id: string): Promise<void> {
  const supabase = createAdminClient();

  // 직접 증가 쿼리
  const { data } = await supabase
    .from('blog_posts')
    .select('view_count')
    .eq('id', id)
    .single();

  if (data) {
    await supabase
      .from('blog_posts')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id);
  }
}

// ====================================================
// 검색
// ====================================================
export async function searchPosts(
  query: string,
  options: BlogSearchOptions = {}
): Promise<{ posts: BlogPost[]; total: number }> {
  const { page = 1, limit = 12 } = options;
  const supabase = createAdminClient();
  const offset = (page - 1) * limit;

  // simple 사전 기반 검색
  const searchTerms = query.trim().split(/\s+/).join(' & ');

  const { data, error, count } = await supabase
    .from('blog_posts')
    .select('*, category:blog_categories(*)', { count: 'exact' })
    .eq('status', 'published')
    .textSearch('search_vector', searchTerms, { config: 'simple' })
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[Blog SSOT] searchPosts error:', error);
    // 폴백: ILIKE 검색
    const { data: fallback, count: fallbackCount } = await supabase
      .from('blog_posts')
      .select('*, category:blog_categories(*)', { count: 'exact' })
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const posts = (fallback || []) as BlogPost[];
    for (const post of posts) {
      post.tags = await fetchPostTags(post.id);
    }
    return { posts, total: fallbackCount || 0 };
  }

  const posts = (data || []) as BlogPost[];
  for (const post of posts) {
    post.tags = await fetchPostTags(post.id);
  }

  return { posts, total: count || 0 };
}

// Admin 이메일 검증 유틸
export function isAdminEmail(email: string | undefined): boolean {
  return email === ADMIN_EMAIL;
}
