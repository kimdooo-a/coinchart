// Badge variant 헬퍼 함수
// page.tsx에서 route-local로 분리 (동작 불변, 순수 함수)

/** 상승 확률 값에 따른 Badge variant 결정 */
export function getProbabilityBadgeVariant(
    probability: number,
): 'default' | 'secondary' | 'destructive' {
    if (probability >= 60) return 'default'
    if (probability <= 40) return 'destructive'
    return 'secondary'
}

/** 신뢰도 등급에 따른 Badge variant 결정 */
export function getConfidenceBadgeVariant(
    grade: string,
): 'default' | 'secondary' | 'destructive' {
    if (grade === 'A' || grade === 'B') return 'default'
    if (grade === 'C') return 'secondary'
    return 'destructive'
}
