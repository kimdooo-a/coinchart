// ip-mask 회귀 테스트 (HIGH-2, 2026-06-20)
// 근본 원인: IP 미상 시 "0.0.0.0" 센티넬 → 모든 익명 사용자 동일 해시 → dedup 전역 공유.
// 수정: IP 미상 시 빈 문자열 반환 → 미들웨어가 해시 헤더를 떨굼 → 라우트의 400 거부 가드 작동.
import { describe, it, expect } from "vitest";
import { extractClientIp, maskIp, hashIp } from "@/lib/community/ip-mask";

describe("extractClientIp", () => {
  it("x-forwarded-for 첫 IP를 추출한다", () => {
    const h = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(extractClientIp({ headers: h })).toBe("203.0.113.7");
  });

  it("x-forwarded-for 부재 시 x-real-ip로 폴백한다", () => {
    const h = new Headers({ "x-real-ip": "198.51.100.4" });
    expect(extractClientIp({ headers: h })).toBe("198.51.100.4");
  });

  it("IP 헤더가 전혀 없으면 빈 문자열을 반환한다(공유 센티넬 금지)", () => {
    const h = new Headers();
    // "0.0.0.0" 같은 고정 센티넬이면 hashIp가 모든 IP 미상 사용자에게 동일 해시를 만들어
    // 신고/추천 dedup이 전역 공유된다 → 반드시 빈 문자열이어야 한다.
    expect(extractClientIp({ headers: h })).toBe("");
  });
});

describe("maskIp", () => {
  it("앞 2옥텟만 노출한다", () => {
    expect(maskIp("203.0.113.7")).toBe("203.0.*.*");
  });

  it("형식이 아니면 기본 마스크를 반환한다", () => {
    expect(maskIp("")).toBe("0.0.*.*");
  });
});

describe("hashIp", () => {
  it("다른 IP는 다른 해시를 만든다", () => {
    expect(hashIp("203.0.113.7")).not.toBe(hashIp("198.51.100.4"));
  });
});
