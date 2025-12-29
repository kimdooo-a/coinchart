export interface ExplanationOutput {
    title: string;
    summary: string;
    keyFactors: string[];
    regimeAnalysis: string;

    // Structured Content (Free & Pro)
    action: 'HOLD' | 'PARTIAL' | 'STOP_LOSS';
    sections: {
        evidence: string;
        risk: string;
        watch: string;
    };
    flags: string[]; // e.g. "Prohibited Term Removed"

    // Raw fields for debugging or details
    grade?: string;
    score?: number;

    isPro: boolean;
}
