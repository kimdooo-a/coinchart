// 블로그 타입 정의

export interface BlogCategory {
  id: string;
  name_ko: string;
  name_en: string;
  slug: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  author_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  content: string; // HTML
  excerpt: string | null;
  featured_image: string | null;
  status: 'draft' | 'published' | 'archived';
  language: 'ko' | 'en';
  meta_title: string | null;
  meta_description: string | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // JOIN 결과
  category?: BlogCategory;
  tags?: BlogTag[];
}

export interface BlogPostInput {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  category_id?: string | null;
  tags?: string[]; // 태그 이름 배열
  status?: 'draft' | 'published' | 'archived';
  language?: 'ko' | 'en';
  meta_title?: string;
  meta_description?: string;
}

export interface BlogPostListOptions {
  page?: number;
  limit?: number;
  category?: string; // slug
  tag?: string; // slug
  lang?: 'ko' | 'en';
}

export interface BlogSearchOptions {
  page?: number;
  limit?: number;
}
