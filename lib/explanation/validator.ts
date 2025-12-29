export const PROHIBITED_PATTERNS = [
    { regex: /AI\s*예측/gi, replacement: "통계적 패턴 분석" },
    { regex: /인공지능\s*분석/gi, replacement: "알고리즘 분석" },
    { regex: /확실한\s*수익/gi, replacement: "긍정적 기대" },
    { regex: /무조건\s*상승/gi, replacement: "상승 가능성 높음" },
    { regex: /예측됩니다/gi, replacement: "분석됩니다" },
    { regex: /보장합니다/gi, replacement: "가능성이 있습니다" }
];

export interface ValidationResult {
    text: string;
    flags: string[];
}

export function validateText(text: string): ValidationResult {
    let cleanText = text;
    const flags: string[] = [];

    PROHIBITED_PATTERNS.forEach(p => {
        if (p.regex.test(cleanText)) {
            cleanText = cleanText.replace(p.regex, p.replacement);
            flags.push(`Replaced prohibited pattern: ${p.regex}`);
        }
    });

    return {
        text: cleanText,
        flags
    };
}
