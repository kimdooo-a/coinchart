/**
 * 블로그 콘텐츠 마이그레이션: TipTap JSON → HTML
 *
 * 사용법: npx tsx scripts/migrate-blog-content-to-html.ts
 *
 * 기존 TipTap JSON 형태의 content를 generateHTML()로 변환하여
 * HTML 문자열로 업데이트합니다.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('환경변수 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const extensions = [
  StarterKit.configure({ codeBlock: false }),
  Image,
  Link,
  CodeBlockLowlight.configure({ lowlight }),
];

async function migrate() {
  console.log('블로그 콘텐츠 마이그레이션 시작...');

  // 모든 블로그 포스트 조회
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, content');

  if (error) {
    console.error('포스트 조회 실패:', error);
    process.exit(1);
  }

  if (!posts || posts.length === 0) {
    console.log('마이그레이션할 포스트가 없습니다.');
    return;
  }

  console.log(`총 ${posts.length}개 포스트 발견`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of posts) {
    try {
      // 이미 HTML 문자열이면 스킵
      if (typeof post.content === 'string') {
        console.log(`  [SKIP] "${post.title}" - 이미 HTML 형식`);
        skipped++;
        continue;
      }

      // TipTap JSON → HTML 변환 (문자열 케이스는 위에서 skip되므로 JSON 콘텐츠로 단언)
      const html = generateHTML(post.content as JSONContent, extensions);

      // DB 업데이트
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ content: html })
        .eq('id', post.id);

      if (updateError) {
        console.error(`  [FAIL] "${post.title}":`, updateError.message);
        failed++;
      } else {
        console.log(`  [OK] "${post.title}" → HTML 변환 완료 (${html.length}자)`);
        success++;
      }
    } catch (err) {
      console.error(`  [FAIL] "${post.title}":`, err);
      failed++;
    }
  }

  console.log('\n마이그레이션 완료:');
  console.log(`  성공: ${success}`);
  console.log(`  스킵: ${skipped}`);
  console.log(`  실패: ${failed}`);
}

migrate();
