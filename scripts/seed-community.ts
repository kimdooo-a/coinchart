/**
 * scripts/seed-community.ts
 *
 * 커뮤니티 게시판(free/market/info) 더미 게시글 시드 스크립트.
 * scripts/fixtures/community-posts.ts 의 MOCK_POSTS 를 community_posts 테이블에 INSERT.
 *
 * 사용:
 *   npx tsx scripts/seed-community.ts            # 기존 행 있으면 중단
 *   npx tsx scripts/seed-community.ts --force    # 기존 행 무시하고 추가
 *
 * 환경변수:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * 모든 시드 게시글은 익명(guest_*)으로 적재한다 — 회원 시드는 본 스크립트 범위 밖.
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import { MOCK_POSTS, type BoardSlug, type MockPost } from "./fixtures/community-posts";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[seed-community] 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const FORCE = process.argv.includes("--force");
const CHUNK_SIZE = 100;
const SEED_PASSWORD = "seed123!"; // 모든 시드 글 공용 비밀번호 (개발용)
const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------
// 매핑 헬퍼
// ---------------------------------------------

/**
 * mock 의 IP 앞2옥텟(예: "211.34")을 DB CHECK 정규식(`^\d+\.\d+\.\*\.\*$`)에 맞게 변환.
 * 이미 마스킹 형식이면 그대로 통과.
 */
function toMaskedIp(raw: string | undefined): string {
  if (!raw) return "0.0.*.*";
  if (/^\d+\.\d+\.\*\.\*$/.test(raw)) return raw;
  const parts = raw.split(".").filter(Boolean);
  const a = parts[0] ?? "0";
  const b = parts[1] ?? "0";
  return `${a}.${b}.*.*`;
}

/**
 * 0~30일 범위의 랜덤 created_at ISO 문자열.
 * mock 의 상대시간 라벨("2일전")은 정확한 timestamp 가 아니므로 분포만 흉내낸다.
 */
function randomCreatedAt(): string {
  const offsetMs = Math.random() * 30 * DAY_MS;
  return new Date(Date.now() - offsetMs).toISOString();
}

function safeCategory(raw: string | undefined): string {
  return raw && raw.trim().length > 0 ? raw : "전체";
}

function safeTags(raw: string[] | undefined): string[] {
  return Array.isArray(raw) ? raw : [];
}

interface CommunityPostRow {
  board_slug: BoardSlug;
  title: string;
  content_html: string;
  author_id: null;
  guest_nickname: string;
  guest_password_hash: string;
  guest_ip_masked: string;
  category: string;
  tags: string[];
  coin_symbol: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_notice: boolean;
  is_hot: boolean;
  created_at: string;
}

function mapMockToRow(mock: MockPost, sharedHash: string): CommunityPostRow {
  // 모든 시드는 익명. 공지(운영자)도 익명 닉네임 "운영자"로 적재.
  const nickname = mock.isAdmin ? "운영자" : mock.author && mock.author !== "익명" ? mock.author : pickFallbackNickname(mock.id);

  return {
    board_slug: mock.boardSlug,
    title: mock.title,
    content_html: mock.contentHtml ?? `<p>${escapeHtml(mock.title)}</p>`,
    author_id: null,
    guest_nickname: clampNickname(nickname),
    guest_password_hash: sharedHash,
    guest_ip_masked: toMaskedIp(mock.authorIp),
    category: safeCategory(mock.category),
    tags: safeTags(mock.tags),
    coin_symbol: mock.coinSymbol ?? null,
    view_count: mock.views ?? 0,
    like_count: mock.likes ?? 0,
    comment_count: mock.commentCount ?? 0,
    is_notice: Boolean(mock.isNotice),
    is_hot: Boolean(mock.isHot),
    created_at: randomCreatedAt(),
  };
}

const FALLBACK_NICKS = ["익명러", "코린이", "차트러", "투자맨", "관망러"];
function pickFallbackNickname(seed: number): string {
  return FALLBACK_NICKS[seed % FALLBACK_NICKS.length];
}

/** DB CHECK: 2~12자 강제 */
function clampNickname(raw: string): string {
  const trimmed = (raw ?? "").trim();
  if (trimmed.length >= 2 && trimmed.length <= 12) return trimmed;
  if (trimmed.length < 2) return "익명러";
  return trimmed.slice(0, 12);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---------------------------------------------
// 메인
// ---------------------------------------------

async function main(): Promise<void> {
  console.log("[seed-community] 시드 시작");

  // 1) community_boards 9행 확인
  const { count: boardsCount, error: boardsErr } = await supabase
    .from("community_boards")
    .select("*", { count: "exact", head: true });

  if (boardsErr) {
    console.error("[seed-community] community_boards 조회 실패:", boardsErr.message);
    process.exit(1);
  }
  if ((boardsCount ?? 0) < 9) {
    console.error(
      `[seed-community] community_boards 행이 부족 (${boardsCount ?? 0}/9). T01 마이그레이션이 적용됐는지 확인.`,
    );
    process.exit(1);
  }
  console.log(`[seed-community] community_boards 확인 (${boardsCount}행)`);

  // 2) 기존 community_posts 확인 → --force 없으면 중단
  const { count: existing, error: existErr } = await supabase
    .from("community_posts")
    .select("*", { count: "exact", head: true });

  if (existErr) {
    console.error("[seed-community] community_posts 조회 실패:", existErr.message);
    process.exit(1);
  }
  if ((existing ?? 0) > 0 && !FORCE) {
    console.error(
      `[seed-community] community_posts 에 이미 ${existing}행 존재. --force 플래그로 추가 적재 가능.`,
    );
    process.exit(1);
  }
  if ((existing ?? 0) > 0) {
    console.log(`[seed-community] 기존 ${existing}행 유지 + 시드 추가 (--force)`);
  }

  // 3) bcrypt 해시 1회 (모든 시드 글 공용)
  const sharedHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // 4) MOCK_POSTS 평탄화 → DB 행으로 매핑
  const boardSlugs: BoardSlug[] = ["free", "market", "info"];
  const rows: CommunityPostRow[] = [];
  for (const slug of boardSlugs) {
    const posts = MOCK_POSTS[slug] ?? [];
    for (const mock of posts) {
      rows.push(mapMockToRow(mock, sharedHash));
    }
  }
  console.log(`[seed-community] 매핑 완료: ${rows.length}행 (${boardSlugs.length}개 게시판)`);

  // 5) 100행씩 chunk INSERT
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from("community_posts").insert(chunk);
    if (error) {
      console.error(`[seed-community] chunk ${i / CHUNK_SIZE + 1} INSERT 실패:`, error.message);
      console.error("  실패 chunk 첫 행:", JSON.stringify(chunk[0], null, 2));
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`[seed-community] chunk ${i / CHUNK_SIZE + 1}: ${chunk.length}행 INSERT (누적 ${inserted})`);
  }

  console.log(`[seed-community] 총 ${inserted}개 게시글 시드 완료`);
}

main().catch((err) => {
  console.error("[seed-community] 예외:", err);
  process.exit(1);
});
