import { TEMPLATES, DEFAULT_VALUES } from './templates';
import { validateText } from './validator';

export interface RenderContext {
    action: 'PARTIAL' | 'HOLD' | 'STOP_LOSS';
    riseProb: number;
    dropProb: number;
    regime: string;
    strongFactors?: string; // joined string or array
    topSignals?: string;
    riskNotes?: string;
    watchNext?: string;
    volatility?: string;
    grade?: string;
}

export function renderTemplate(ctx: RenderContext): { sections: { evidence: string; risk: string; watch: string }; flags: string[] } {
    const template = TEMPLATES[ctx.action];
    const flags: string[] = [];

    const safeReplace = (tpl: string, key: string, val: any) => {
        const strVal = val !== undefined && val !== null ? String(val) : (DEFAULT_VALUES as any)[key] || "";
        return tpl.replace(new RegExp(`{${key}}`, 'g'), strVal);
    };

    const processSection = (text: string) => {
        let processed = text;
        const keys = [
            'riseProb', 'dropProb', 'regime', 'strongFactors',
            'topSignals', 'riskNotes', 'watchNext', 'volatility', 'grade'
        ];

        keys.forEach(k => {
            processed = safeReplace(processed, k, (ctx as any)[k]);
        });

        const validated = validateText(processed);
        flags.push(...validated.flags);
        return validated.text;
    };

    return {
        sections: {
            evidence: processSection(template.evidence),
            risk: processSection(template.risk),
            watch: processSection(template.watch)
        },
        flags: [...new Set(flags)]
    };
}
