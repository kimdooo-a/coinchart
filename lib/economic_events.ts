
export type EconomicEvent = {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm (KST)
    impact: 'high' | 'medium' | 'low';
    description: string;
    category: 'FOMC' | 'CPI' | 'EMPLOYMENT';
};

// 2025 Schedule (Approximated based on ET -> KST conversion)
// FOMC: 2:00 PM ET -> 4:00 AM KST (Next Day in Winter), 3:00 AM KST (Next Day in Summer)
// CPI: 8:30 AM ET -> 10:30 PM KST (Winter), 9:30 PM KST (Summer)

export const ECONOMIC_EVENTS: EconomicEvent[] = [
    // --- FOMC (Federal Open Market Committee) ---
    {
        id: 'fomc-2025-01',
        title: '미국 FOMC 금리결정',
        date: '2025-01-30', // Jan 29 ET -> Jan 30 KST
        time: '04:00',
        impact: 'high',
        description: '미국 연준의 기준금리 결정. 시장의 방향성을 결정하는 가장 중요한 이벤트입니다.',
        category: 'FOMC'
    },
    {
        id: 'fomc-2025-03',
        title: '미국 FOMC 금리결정 (SEP)',
        date: '2025-03-20', // Mar 19 ET -> Mar 20 KST
        time: '03:00', // DST Active
        impact: 'high',
        description: '금리 결정 및 경제 전망(점도표) 발표. 향후 금리 인하/인상 경로를 가늠할 수 있습니다.',
        category: 'FOMC'
    },
    {
        id: 'fomc-2025-05',
        title: '미국 FOMC 금리결정',
        date: '2025-05-08',
        time: '03:00',
        impact: 'high',
        description: '연준의 통화정책 발표. 파월 의장의 기자회견 발언에 주목해야 합니다.',
        category: 'FOMC'
    },
    {
        id: 'fomc-2025-06',
        title: '미국 FOMC 금리결정 (SEP)',
        date: '2025-06-19',
        time: '03:00',
        impact: 'high',
        description: '분기별 경제 전망과 함께 발표되는 금리 결정. 시장 변동성이 매우 커질 수 있습니다.',
        category: 'FOMC'
    },
    {
        id: 'fomc-2025-07',
        title: '미국 FOMC 금리결정',
        date: '2025-07-31',
        time: '03:00',
        impact: 'high',
        description: '하반기 통화정책의 분수령. 인플레이션 데이터에 따른 연준의 대응을 확인해야 합니다.',
        category: 'FOMC'
    },
    {
        id: 'fomc-2025-09',
        title: '미국 FOMC 금리결정 (SEP)',
        date: '2025-09-18',
        time: '03:00',
        impact: 'high',
        description: '경제 전망 수정치 발표. 연말 금리 목표치가 구체화되는 시점입니다.',
        category: 'FOMC'
    },
    {
        id: 'fomc-2025-10',
        title: '미국 FOMC 금리결정',
        date: '2025-10-30',
        time: '03:00', // DST Might be tricky, usually ends late Oct/Early Nov. Assuming DST still on or just off. Let's say 03:00 for safety or 04:00. US DST ends Nov 2 in 2025. So Oct 29 is still DST.
        impact: 'high',
        description: '미국 대선 전후의 통화정책 기조를 확인할 수 있는 회의입니다.',
        category: 'FOMC'
    },
    {
        id: 'fomc-2025-12',
        title: '미국 FOMC 금리결정 (SEP)',
        date: '2025-12-11',
        time: '04:00', // DST Ended
        impact: 'high',
        description: '2025년 마지막 금리 결정 및 2026년 경제 전망 발표.',
        category: 'FOMC'
    },

    // --- CPI (Consumer Price Index) ---
    {
        id: 'cpi-2025-01',
        title: '미국 1월 CPI (소비자물가지수)',
        date: '2025-02-12',
        time: '22:30', // Winter
        impact: 'high',
        description: '인플레이션 둔화 여부를 판단하는 핵심 지표. 예상치보다 높으면 악재, 낮으면 호재입니다.',
        category: 'CPI'
    },
    {
        id: 'cpi-2025-02',
        title: '미국 2월 CPI (소비자물가지수)',
        date: '2025-03-12',
        time: '21:30', // DST starts Mar 9
        impact: 'high',
        description: '금리 결정에 직접적인 영향을 주는 물가 데이터입니다.',
        category: 'CPI'
    },
    {
        id: 'cpi-2025-03',
        title: '미국 3월 CPI (소비자물가지수)',
        date: '2025-04-10',
        time: '21:30',
        impact: 'high',
        description: '1분기 물가 흐름을 종합적으로 판단할 수 있는 지표입니다.',
        category: 'CPI'
    },
    {
        id: 'cpi-2025-04',
        title: '미국 4월 CPI (소비자물가지수)',
        date: '2025-05-13',
        time: '21:30',
        impact: 'high',
        description: '소비자 물가 추이를 확인하는 중요 지표입니다.',
        category: 'CPI'
    },
    {
        id: 'cpi-2025-05',
        title: '미국 5월 CPI (소비자물가지수)',
        date: '2025-06-11',
        time: '21:30',
        impact: 'high',
        description: '여름 시즌 진입 전 물가 동향을 체크합니다.',
        category: 'CPI'
    },
    {
        id: 'cpi-2025-06',
        title: '미국 6월 CPI (소비자물가지수)',
        date: '2025-07-15',
        time: '21:30',
        impact: 'high',
        description: '상반기 결산 물가 지표. 연준의 하반기 정책에 영향을 줍니다.',
        category: 'CPI'
    },
    {
        id: 'cpi-2025-07',
        title: '미국 7월 CPI (소비자물가지수)',
        date: '2025-08-12',
        time: '21:30',
        impact: 'high',
        description: '하계 휴가철 소비가 반영된 물가 지수입니다.',
        category: 'CPI'
    },
    {
        id: 'cpi-2025-08',
        title: '미국 8월 CPI (소비자물가지수)',
        date: '2025-09-11',
        time: '21:30',
        impact: 'high',
        description: '9월 FOMC를 앞두고 발표되는 중요한 물가 지표입니다.',
        category: 'CPI'
    },
    {
        id: 'cpi-2025-09',
        title: '미국 9월 CPI (소비자물가지수)',
        date: '2025-10-24',
        time: '21:30',
        impact: 'high',
        description: '4분기 물가 흐름의 시작점입니다.',
        category: 'CPI'
    },
    {
        id: 'cpi-2025-11',
        title: '미국 11월 CPI (소비자물가지수)',
        date: '2025-12-18',
        time: '22:30', // DST Ended
        impact: 'high',
        description: '연말 소비 시즌의 물가 압력을 확인할 수 있습니다.',
        category: 'CPI'
    },

    // --- 2026 FOMC (Tentative Schedule) ---
    {
        id: 'fomc-2026-01',
        title: '미국 FOMC 금리결정',
        date: '2026-01-29', // Jan 28 ET -> Jan 29 KST
        time: '04:00',
        impact: 'high',
        description: '2026년 첫 금리 결정. 연준의 새해 통화정책 방향을 확인하는 자리입니다.',
        category: 'FOMC'
    },
    {
        id: 'fomc-2026-03',
        title: '미국 FOMC 금리결정 (SEP)',
        date: '2026-03-19', // Mar 18 ET -> Mar 19 KST
        time: '03:00', // DST Active
        impact: 'high',
        description: '경제 전망(SEP) 발표 포함. 2026년 금리 인하 경로가 구체화될 것입니다.',
        category: 'FOMC'
    },
    {
        id: 'fomc-2026-04',
        title: '미국 FOMC 금리결정',
        date: '2026-04-30', // Apr 29 ET -> Apr 30 KST
        time: '03:00',
        impact: 'high',
        description: '상반기 경제 지표에 따른 연준의 정책 조정을 확인합니다.',
        category: 'FOMC'
    },
    {
        id: 'fomc-2026-06',
        title: '미국 FOMC 금리결정 (SEP)',
        date: '2026-06-18', // Jun 17 ET -> Jun 18 KST
        time: '03:00',
        impact: 'high',
        description: '하반기 경제 전망 수정 및 정책 방향성 재설정.',
        category: 'FOMC'
    },
    {
        id: 'fomc-2026-07',
        title: '미국 FOMC 금리결정',
        date: '2026-07-30', // Jul 29 ET -> Jul 30 KST
        time: '03:00',
        impact: 'high',
        description: '여름 시즌의 인플레이션 데이터 반영 여부가 핵심입니다.',
        category: 'FOMC'
    },
    {
        id: 'fomc-2026-09',
        title: '미국 FOMC 금리결정 (SEP)',
        date: '2026-09-17', // Sep 16 ET -> Sep 17 KST
        time: '03:00',
        impact: 'high',
        description: '4분기 및 내년 경제 전망 발표.',
        category: 'FOMC'
    },
    {
        id: 'fomc-2026-10',
        title: '미국 FOMC 금리결정',
        date: '2026-10-29', // Oct 28 ET -> Oct 29 KST
        time: '03:00',
        impact: 'high',
        description: '연말을 앞둔 통화정책 점검.',
        category: 'FOMC'
    },
    {
        id: 'fomc-2026-12',
        title: '미국 FOMC 금리결정 (SEP)',
        date: '2026-12-10', // Dec 9 ET -> Dec 10 KST
        time: '04:00', // DST Ended
        impact: 'high',
        description: '2026년 마지막 금리 결정 및 2027년 전망.',
        category: 'FOMC'
    },

    // --- 2026 CPI (Forecast / Pattern Based) ---
    {
        id: 'cpi-2026-01',
        title: '미국 12월 CPI (소비자물가지수)',
        date: '2026-01-13', // Confirmed
        time: '22:30',
        impact: 'high',
        description: '2025년 12월 물가 데이터 발표. 새해 첫 인플레이션 지표입니다.',
        category: 'CPI'
    }
    // CPI dates for 2026 are widely approximated beyond Jan. Stopping here to avoid misinformation.
];
