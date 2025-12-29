/**
 * Supabase KV Cache Layer
 * 
 * Supabase 테이블을 캐시로 활용 (Redis 대체)
 * - 무료 티어 사용 가능
 * - TTL 기반 자동 만료
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: number; // Unix timestamp (seconds)
}

const CACHE_TABLE = 'analysis_cache';

/**
 * 캐시 테이블 초기화 (한 번만 실행)
 * SQL:
 * CREATE TABLE IF NOT EXISTS analysis_cache (
 *   key TEXT PRIMARY KEY,
 *   value JSONB NOT NULL,
 *   expires_at TIMESTAMPTZ NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE INDEX IF NOT EXISTS idx_analysis_cache_expires ON analysis_cache(expires_at);
 */

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from(CACHE_TABLE)
      .select('value, expires_at')
      .eq('key', key)
      .single();

    if (error || !data) {
      return null;
    }

    // 만료 체크
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = new Date(data.expires_at).getTime() / 1000;

    if (now > expiresAt) {
      // 만료된 항목 삭제
      await supabaseAdmin
        .from(CACHE_TABLE)
        .delete()
        .eq('key', key);
      return null;
    }

    return data.value as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300 // 기본 5분
): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    const { error } = await supabaseAdmin
      .from(CACHE_TABLE)
      .upsert({
        key,
        value,
        expires_at: expiresAt,
      }, {
        onConflict: 'key',
      });

    if (error) {
      console.error('Cache set error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

export async function deleteCache(key: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from(CACHE_TABLE)
      .delete()
      .eq('key', key);

    if (error) {
      console.error('Cache delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

/**
 * 만료된 캐시 정리 (Cron Job에서 주기적 실행)
 */
export async function cleanupExpiredCache(): Promise<number> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from(CACHE_TABLE)
      .delete()
      .lt('expires_at', now)
      .select('key');

    if (error) {
      console.error('Cache cleanup error:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Cache cleanup error:', error);
    return 0;
  }
}








