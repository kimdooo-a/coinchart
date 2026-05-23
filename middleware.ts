
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { extractClientIp, maskIp, hashIp } from '@/lib/community/ip-mask'

// Node.js 런타임 명시 (R2/T05, 2026-05-23):
//   ip-mask.ts가 `node:crypto`(hashIp)를 import → Edge 런타임에서 빌드 경고 발생.
//   미들웨어를 Node.js 런타임으로 고정해 경고를 해소한다. (인증/헤더 주입 로직 불변)
export const runtime = 'nodejs'

// 익명 게스트 IP 헤더 주입 대상 경로 (R1 2026-05-23, T07)
const IP_INJECT_PATHS = ['/board', '/api/board', '/api/community']

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // 1) board/community 경로에 마스킹된 IP 헤더 주입
    const requestHeaders = new Headers(request.headers)
    if (IP_INJECT_PATHS.some((p) => path.startsWith(p))) {
        const ip = extractClientIp({ headers: request.headers })
        requestHeaders.set('x-client-ip', ip)
        requestHeaders.set('x-client-ip-masked', maskIp(ip))
        requestHeaders.set('x-client-ip-hash', hashIp(ip))
    }

    let response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })

    // 2) API 경로는 세션 새로고침 스킵 (커뮤니티 API는 자체 인증 사용)
    if (path.startsWith('/api/')) {
        return response
    }

    // 3) Create Supabase client with cookie handling
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request: {
                            headers: requestHeaders,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 보호 대상 라우트 (인증 필요)
    const protectedPaths = ['/portfolio', '/settings', '/watchlist', '/secure-memo', '/admin']
    const isProtected = protectedPaths.some((p) =>
        request.nextUrl.pathname.startsWith(p)
    )

    // Redirect to login if accessing protected route without session
    if (isProtected && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/ (API routes - generally managed by themselves, or you can add if needed)
         * - auth/ (Auth routes must be public)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)',
        // T07: 익명 작성용 IP 헤더 주입 대상 API
        '/api/board/:path*',
        '/api/community/:path*',
    ],
}
