import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

// 첫 접근 시점에 클라이언트를 생성한다(lazy).
// 모듈 로드 시점에 createClient를 호출하면, ESM import 호이스팅 때문에
// 진입점의 dotenv.config()보다 먼저 실행되어 빈 env로 초기화되는 잠복버그가 있었다
// (daily_cron.ts → batch_orchestrator → batch_analysis → 이 모듈 순으로 호이스팅,
//  dotenv.config()가 그보다 늦게 실행 → module-load 시 빈 env). lazy화로 이를 차단한다.
function getClient(): SupabaseClient {
    if (_client) return _client;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL or Service Role Key is missing.');
    }

    // Service Role Key 기반 admin 클라이언트 (RLS 우회).
    _client = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
    return _client;
}

// 기존 호출부(`supabaseAdmin.from(...)` 등)를 수정하지 않고 lazy 동작을 얻기 위해 Proxy로 노출.
// 첫 프로퍼티 접근 시 getClient()가 실행되며, 메서드는 client에 bind하여 내부 this를 보존한다.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
        const client = getClient();
        const value = Reflect.get(client, prop, receiver);
        return typeof value === 'function' ? value.bind(client) : value;
    },
});
