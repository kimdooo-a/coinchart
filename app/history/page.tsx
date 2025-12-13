'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';

type HistoryEvent = {
    year: number;
    month: string;
    descEn: string;
    descKo: string;
    detailsEn: string;
    detailsKo: string;
    type: 'milestone' | 'tech' | 'market' | 'drama';
};

const COIN_INFO: Record<string, { titleEn: string; titleKo: string; descEn: string; descKo: string }> = {
    BTC: {
        titleEn: "Bitcoin: The King of Crypto",
        titleKo: "비트코인: 암호화폐의 제왕",
        descEn: "Bitcoin (BTC) is the first decentralized cryptocurrency, created in 2009 by the mysterious Satoshi Nakamoto. It introduced the revolutionary concept of blockchain technology, solving the double-spending problem without the need for a central authority. Often referred to as 'Digital Gold,' Bitcoin serves as the premier store of value in the digital age, governed by a hard cap of 21 million coins which ensures scarcity. Over the years, it has survived regulatory bans, technical wars, and market crashes to become a globally recognized asset class, now integrated into traditional finance through ETFs.",
        descKo: "비트코인(BTC)은 2009년 미지의 인물 사토시 나카모토에 의해 창시된 최초의 탈중앙화 암호화폐입니다. 중앙 관리자 없이 이중 지불 문제를 해결하는 혁신적인 블록체인 기술을 세상에 내놓았습니다. '디지털 금'으로 불리는 비트코인은 2,100만 개라는 엄격한 공급 제한을 통해 희소성을 보장하며, 디지털 시대의 독보적인 가치 저장 수단으로 자리 잡았습니다. 수년간의 규제와 기술적 분쟁, 시장 붕괴를 견뎌내며 이제는 ETF 등을 통해 제도권 금융 시스템의 핵심 자산으로 인정받고 있습니다."
    },
    ETH: {
        titleEn: "Ethereum: The World Computer",
        titleKo: "이더리움: 월드 컴퓨터",
        descEn: "Ethereum (ETH), proposed by Vitalik Buterin in 2013, expanded the potential of blockchain beyond simple transactions. usage. By introducing 'Smart Contracts,' it allowed developers to build decentralized applications (dApps) on top of its network, giving birth to entire industries like DeFi (Decentralized Finance) and NFTs. It essentially acts as a global, programmable supercomputer. With its successful transition to Proof-of-Stake via 'The Merge,' Ethereum has significantly reduced its energy consumption and continues to scale, serving as the backbone of the Web3 ecosystem.",
        descKo: "이더리움(ETH)은 2013년 비탈릭 부테린이 제안하여 블록체인의 잠재력을 단순 화폐 이상으로 확장시켰습니다. '스마트 컨트랙트'를 도입함으로써 개발자들이 네트워크 위에서 다양한 탈중앙화 애플리케이션(dApps)을 구축할 수 있게 했으며, 이는 디파이(DeFi)와 NFT 같은 거대한 산업의 탄생으로 이어졌습니다. 사실상 전 세계가 공유하는 프로그래밍 가능한 슈퍼컴퓨터 역할을 합니다. '더 머지(The Merge)'를 통해 지분 증명(PoS)으로 성공적으로 전환하며 에너지 소비를 획기적으로 줄였고, Web3 생태계의 중추로서 끊임없이 확장하고 있습니다."
    },
    SOL: {
        titleEn: "Solana: High-Performance Blockchain",
        titleKo: "솔라나: 초고속 고성능 블록체인",
        descEn: "Solana (SOL) is a high-performance blockchain designed for mass adoption, characterized by its incredibly fast transaction speeds and low fees. Utilizing a unique 'Proof of History' (PoH) timing mechanism, it can process thousands of transactions per second without reliable on sharding. This makes it an ideal platform for high-frequency use cases like decentralized exchanges and gaming. despite facing challenges like network outages and the FTX collapse, Solana has shown remarkable resilience, rising like a phoenix with a thriving ecosystem of developers and users.",
        descKo: "솔라나(SOL)는 대중적인 채택을 목표로 설계된 고성능 블록체인으로, 놀라울 정도로 빠른 처리 속도와 저렴한 수수료가 특징입니다. 독자적인 '역사 증명(Proof of History)' 메커니즘을 통해 샤딩 없이도 초당 수천 건의 트랜잭션을 처리할 수 있습니다. 이는 탈중앙화 거래소나 게임과 같이 높은 빈도의 처리가 필요한 분야에 최적화된 플랫폼임을 의미합니다. 네트워크 중단이나 FTX 사태와 같은 시련에도 불구하고, 솔라나는 활발한 개발자와 사용자 생태계를 바탕으로 불사조처럼 부활하며 강력한 회복력을 증명했습니다."
    },
    XRP: {
        titleEn: "XRP: The Bridge Currency",
        titleKo: "XRP: 국경 없는 가교 통화",
        descEn: "XRP is a digital asset built for payments, serving as a bridge currency to facilitate cross-border transactions quickly and cheaply. Unlike Bitcoin, it uses the XRP Ledger Consensus Protocol, which requires no mining and settles transactions in seconds. Developed with a focus on enterprise use cases, it aims to work with banks and financial institutions to provide necessary liquidity. XRP has famously battled successfully for regulatory clarity in the US, setting historic legal precedents for the entire crypto industry.",
        descKo: "XRP는 결제를 위해 설계된 디지털 자산으로, 국경 간 거래를 빠르고 저렴하게 연결하는 가교 통화 역할을 합니다. 비트코인과 달리 채굴이 필요 없는 'XRP 레저 합의 프로토콜'을 사용하여 몇 초 만에 거래를 확정 짓습니다. 기업 및 금융 기관과의 협력을 목표로 개발되어 유동성을 공급하는 데 중점을 둡니다. 특히 미국 규제 당국과의 긴 법적 공방 끝에 승기를 잡으며 암호화폐 업계 전체에 역사적인 법적 선례를 남긴 것으로 유명합니다."
    },
    BCH: {
        titleEn: "Bitcoin Cash: Peer-to-Peer Electronic Cash",
        titleKo: "비트코인 캐시: P2P 전자 화폐",
        descEn: "Bitcoin Cash (BCH) emerged from a historic hard fork of Bitcoin in 2017, driven by a community faction that believed Bitcoin should primarily be a medium of exchange rather than just a store of value. by increasing the block size, BCH allows for more transactions to be processed significantly cheaper and faster. It embodies the vision of 'Peer-to-Peer Electronic Cash' as described in the original whitepaper. With upgrades like CashTokens, it now also supports smart contracts and DeFi, aiming to combine payment efficiency with programmable money functionality.",
        descKo: "비트코인 캐시(BCH)는 비트코인이 단순 가치 저장 수단이 아닌 실질적인 결제 수단이어야 한다고 믿는 커뮤니티에 의해 2017년 역사적인 하드포크로 탄생했습니다. 블록 크기를 늘림으로써 더 많은 거래를 훨씬 저렴하고 빠르게 처리할 수 있도록 설계되었습니다. 이는 원본 백서에 기술된 'P2P 전자 화폐'의 비전을 계승합니다. 최근 캐시토큰(CashTokens) 업그레이드를 통해 스마트 컨트랙트와 디파이 기능까지 탑재하며, 결제 효율성과 프로그래밍 가능한 화폐의 기능을 결합하고 있습니다."
    },
    DOGE: {
        titleEn: "Dogecoin: The People's Crypto",
        titleKo: "도지코인: 인민의 코인",
        descEn: "Dogecoin (DOGE) started in 2013 as a joke, parodying the wild speculation in the crypto market. Featuring the Shiba Inu 'Doge' meme, it quickly cultivated a friendly and generous community known for charitable causes. What began as satire became a serious contender when it captured the attention of mainstream culture and figures like Elon Musk. It runs on Proof-of-Work similar to Litecoin and is beloved for its low fees and uncapped supply, which encourages spending rather than hoarding. It stands as a testament to the power of community and meme culture in finance.",
        descKo: "도지코인(DOGE)은 2013년 암호화폐 시장의 투기 열풍을 풍자하기 위한 장난으로 시작되었습니다. 시바견 '도지' 밈을 마스코트로 내세워 자선 활동 등 친근하고 관대한 커뮤니티 문화를 형성했습니다. 풍자로 시작된 이 코인은 일론 머스크와 같은 저명인사와 대중문화의 주목을 받으며 메이저 코인으로 발돋움했습니다. 라이트코인과 유사한 작업 증명 방식을 사용하며, 낮은 수수료와 무제한 공급 정책으로 '쟁여두기'보다 '사용'을 장려합니다. 이는 금융에서 커뮤니티와 밈 문화가 가진 힘을 보여주는 상징적인 존재입니다."
    }
};

const COIN_HISTORY: Record<string, HistoryEvent[]> = {
    BTC: [
        {
            year: 2008, month: '10',
            descEn: 'Satoshi Nakamoto publishes the Bitcoin Whitepaper during the Global Financial Crisis.',
            descKo: '사토시 나카모토가 글로벌 금융 위기 속에 비트코인 백서를 공개함.',
            detailsEn: 'On October 31, 2008, Satoshi Nakamoto released the whitepaper titled "Bitcoin: A Peer-to-Peer Electronic Cash System". It proposed a solution to the double-spending problem without requiring a trusted third party, laying the foundation for decentralized finance.',
            detailsKo: '2008년 10월 31일, 사토시 나카모토는 "비트코인: P2P 전자 화폐 시스템"이라는 제목의 백서를 발표했습니다. 이는 신뢰할 수 있는 제3자 없이 이중 지불 문제를 해결하는 방안을 제시하며 탈중앙화 금융의 기초를 마련했습니다.',
            type: 'milestone'
        },
        {
            year: 2009, month: '01',
            descEn: 'Genesis Block mined. "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks."',
            descKo: '제네시스 블록 채굴 시작. "더 타임스 2009/1/3 은행들의 두 번째 구제금융을 앞둔 재무장관"',
            detailsEn: 'Block 0, the Genesis Block, was mined by Satoshi on January 3, 2009. The embedded message from The Times criticized the modern banking system and highlighted the motivation behind Bitcoin\'s creation.',
            detailsKo: '2009년 1월 3일, 사토시가 제네시스 블록(블록 0)을 채굴했습니다. 블록에 포함된 더 타임스(The Times)의 헤드라인 메시지는 현대 은행 시스템을 비판하며 비트코인 창시의 배경을 강조했습니다.',
            type: 'tech'
        },
        {
            year: 2010, month: '05',
            descEn: 'Bitcoin Pizza Day. Laszlo Hanyecz pays 10,000 BTC for two Papa John\'s pizzas.',
            descKo: '비트코인 피자 데이. 라스즐로 하예츠가 피자 두 판에 1만 BTC를 지불함.',
            detailsEn: 'On May 22, 2010, Laszlo Hanyecz made the first known commercial transaction using Bitcoin, paying 10,000 BTC for two pizzas. This event demonstrated Bitcoin\'s potential as a medium of exchange, although the value of those coins today would be astronomical.',
            detailsKo: '2010년 5월 22일, 라스즐로 하예츠는 비트코인을 사용한 최초의 상업적 거래로 피자 두 판에 10,000 BTC를 지불했습니다. 이 사건은 비트코인의 교환 매체로서의 가능성을 보여주었으며, 오늘날 그 가치는 천문학적입니다.',
            type: 'drama'
        },
        {
            year: 2011, month: '02',
            descEn: 'Bitcoin reaches parity with the US Dollar ($1.00).',
            descKo: '비트코인이 처음으로 1달러와 동일한 가치에 도달함.',
            detailsEn: 'In February 2011, Bitcoin achieved a significant psychological milestone by reaching parity with the US Dollar ($1.00). This event garnered mainstream media attention and sparked the first wave of serious interest from investors and tech enthusiasts.',
            detailsKo: '2011년 2월, 비트코인은 1달러와 동일한 가치에 도달하며 중요한 심리적 이정표를 세웠습니다. 이 사건은 주류 언론의 주목을 받았으며 투자자와 기술 애호가들의 진지한 관심을 불러일으킨 첫 번째 계기가 되었습니다.',
            type: 'market'
        },
        {
            year: 2013, month: '10',
            descEn: 'FBI shuts down Silk Road. Price crashes briefly but recovers.',
            descKo: 'FBI가 실크로드를 폐쇄함. 가격이 일시 폭락했으나 곧 회복.',
            detailsEn: 'The FBI seized the Silk Road darknet marketplace and arrested its founder, Ross Ulbricht. While initially causing a panic sell-off, Bitcoin\'s price recovered quickly, proving its resilience and decoupling its reputation from solely illicit activities.',
            detailsKo: 'FBI는 실크로드 다크웹 마켓플레이스를 압수하고 설립자 로스 울브리히트를 체포했습니다. 초기에는 패닉 셀을 유발했지만, 비트코인 가격은 빠르게 회복되었으며 이는 불법 활동과의 연관성에서 벗어나 비트코인의 회복탄력성을 입증하는 계기가 되었습니다.',
            type: 'drama'
        },
        {
            year: 2014, month: '02',
            descEn: 'Mt. Gox files for bankruptcy after losing 850,000 BTC in a massive hack.',
            descKo: '마운트곡스(Mt. Gox)가 해킹으로 85만 BTC를 분실하고 파산 신청.',
            detailsEn: 'Mt. Gox, once handling over 70% of all Bitcoin transactions, collapsed after revealing it had lost 850,000 BTC to hackers. This catastrophic event triggered a multi-year bear market and highlighted the risks of centralized exchanges.',
            detailsKo: '전체 비트코인 거래의 70% 이상을 처리하던 마운트곡스는 해커에게 850,000 BTC를 도난당했다고 밝힌 후 붕괴했습니다. 이 재앙적인 사건은 수년간의 하락장을 초래했으며 중앙화된 거래소의 위험성을 부각시켰습니다.',
            type: 'drama'
        },
        {
            year: 2017, month: '12',
            descEn: 'The Great Bull Run. Bitcoin hits near $20,000 ATH.',
            descKo: '대폭등장. 비트코인이 2만 달러에 육박하며 사상 최고가 경신.',
            detailsEn: 'Driven by retail frenzy and the ICO boom, Bitcoin skyrocketed to nearly $20,000. Futures trading launched on CBOE and CME, marking the beginning of Wall Street\'s involvement.',
            detailsKo: '개인 투자자들의 열광과 ICO 붐에 힘입어 비트코인은 2만 달러에 육박했습니다. CBOE와 CME에서 선물 거래가 시작되면서 월스트리트의 참여가 본격화되었습니다.',
            type: 'market'
        },
        {
            year: 2020, month: '05',
            descEn: '3rd Halving. Block reward drops to 6.25 BTC. Institutional interest (MicroStrategy) begins.',
            descKo: '3번째 반감기. 보상이 6.25 BTC로 감소. 마이크로스트레티지 등 기관 투자 시작.',
            detailsEn: 'The third halving reduced inflation, coinciding with unprecedented global monetary stimulus. MicroStrategy and Tesla eventually added Bitcoin to their balance sheets, validating it as a treasury reserve asset.',
            detailsKo: '세 번째 반감기는 인플레이션을 줄였으며, 전례 없는 글로벌 유동성 공급과 맞물렸습니다. 마이크로스트레티지와 테슬라가 비트코인을 대차대조표에 추가하여 자산으로서의 가치를 입증했습니다.',
            type: 'tech'
        },
        {
            year: 2021, month: '11',
            descEn: 'New ATH reached at $69,000 driven by ETF futures and mainstream adoption.',
            descKo: '선물 ETF 승인과 대중적 채택에 힘입어 6만 9천 달러 최고가 경신.',
            detailsEn: 'Bitcoin reached an all-time high of $69,000, fueled by the launch of the first Bitcoin Futures ETF (BITO) in the US and growing acceptance as "digital gold" against inflation.',
            detailsKo: '비트코인은 미국 최초의 비트코인 선물 ETF(BITO) 출시와 인플레이션 헤지 수단인 "디지털 금"으로서의 인식이 확산되면서 사상 최고가인 69,000달러를 달성했습니다.',
            type: 'market'
        },
        {
            year: 2022, month: '11',
            descEn: 'FTX Collapse triggers a massive crypto winter.',
            descKo: 'FTX 거래소 붕괴로 인한 대규모 크립토 윈터 도래.',
            detailsEn: 'The collapse of FTX due to fraud and mismanagement wiped out billions in value and severely damaged trust in the industry. Bitcoin dropped below $16,000, marking the bottom of the cycle.',
            detailsKo: '사기와 방만 경영으로 인한 FTX의 붕괴는 수십억 달러의 가치를 증발시키고 업계에 대한 신뢰를 심각하게 훼손했습니다. 비트코인은 16,000달러 아래로 떨어지며 사이클의 바닥을 찍었습니다.',
            type: 'drama'
        },
        {
            year: 2024, month: '01',
            descEn: 'US SEC approves Spot Bitcoin ETFs. A historic milestone for institutional adoption.',
            descKo: '미국 SEC, 비트코인 현물 ETF 승인. 제도권 편입의 역사적 이정표.',
            detailsEn: 'After a decade of rejections, the SEC approved Spot Bitcoin ETFs from giants like BlackRock and Fidelity. This opened the floodgates for institutional capital, fundamentally changing Bitcoin\'s market structure.',
            detailsKo: '10년 간의 거절 끝에 SEC는 블랙록, 피델리티 등 거대 기업의 비트코인 현물 ETF를 승인했습니다. 이는 기관 자금 유입의 물꼬를 터 비트코인의 시장 구조를 근본적으로 변화시켰습니다.',
            type: 'milestone'
        },
        {
            year: 2024, month: '04',
            descEn: '4th Halving. Reward drops to 3.125 BTC.',
            descKo: '4번째 반감기. 채굴 보상이 3.125 BTC로 감소.',
            detailsEn: 'The 4th halving reduced the daily issuance of Bitcoin significantly. Unlike previous halvings, the price did not immediately dump, supported by continuous ETF inflows.',
            detailsKo: '4번째 반감기로 비트코인의 일일 발행량이 크게 감소했습니다. 이전 반감기와 달리 지속적인 ETF 유입 덕분에 가격 급락 없이 안정적인 흐름을 보였습니다.',
            type: 'tech'
        },
        {
            year: 2025, month: '10',
            descEn: 'Projected: Bitcoin matures as a sovereign-grade asset class.',
            descKo: '전망: 비트코인이 국가급 자산 클래스로 성숙해가는 단계.',
            detailsEn: 'Analysts predict that by late 2025, Bitcoin could be integrated into sovereign wealth funds and central bank reserves, solidifying its status alongside gold and US Treasuries.',
            detailsKo: '분석가들은 2025년 말까지 비트코인이 국부 펀드와 중앙은행 준비금에 통합되어 금, 미국 국채와 함께 주요 자산으로 자리 잡을 것으로 전망합니다.',
            type: 'market'
        },
    ],
    ETH: [
        {
            year: 2013, month: '11',
            descEn: 'Vitalik Buterin proposes Ethereum Whitepaper.',
            descKo: '비탈릭 부테린이 이더리움 백서를 제안함.',
            detailsEn: 'Vitalik Buterin proposed Ethereum to overcome Bitcoin\'s limitations, introducing a Turing-complete programming language for building decentralized applications (dApps) and smart contracts.',
            detailsKo: '비탈릭 부테린은 비트코인의 한계를 극복하기 위해 이더리움을 제안했으며, 탈중앙화 애플리케이션(dApps)과 스마트 컨트랙트를 구축할 수 있는 튜링 완전 프로그래밍 언어를 도입했습니다.',
            type: 'milestone'
        },
        {
            year: 2015, month: '07',
            descEn: 'Frontier Launch (Genesis). Smart Contracts are born.',
            descKo: '프론티어(Frontier) 런칭. 스마트 컨트랙트의 시대 개막.',
            detailsEn: 'The "Frontier" release marked the official launch of the Ethereum blockchain. It was a bare-bones version intended for developers to mine Ether and start building the first smart contracts.',
            detailsKo: '"프론티어" 릴리스는 이더리움 블록체인의 공식적인 시작을 알렸습니다. 개발자들이 이더를 채굴하고 최초의 스마트 컨트랙트를 구축할 수 있도록 설계된 초기 버전이었습니다.',
            type: 'tech'
        },
        {
            year: 2016, month: '06',
            descEn: 'The DAO Hack drains 3.6M ETH. Leads to Hard Fork (ETH vs ETC).',
            descKo: 'DAO 해킹으로 360만 ETH 도난. 하드포크로 이더리움(ETH)과 클래식(ETC) 분리.',
            detailsEn: 'A vulnerability in "The DAO" smart contract was exploited to drain 3.6 million ETH. The community controversially voted to hard fork the chain to reverse the theft, creating Ethereum (ETH) and leaving the original chain as Ethereum Classic (ETC).',
            detailsKo: '"The DAO" 스마트 컨트랙트의 취약점이 악용되어 360만 ETH가 도난당했습니다. 커뮤니티는 투표를 통해 도난을 되돌리기 위한 하드포크를 결정했고, 이로 인해 이더리움(ETH)이 탄생하고 기존 체인은 이더리움 클래식(ETC)으로 남게 되었습니다.',
            type: 'drama'
        },
        {
            year: 2017, month: '06',
            descEn: 'ICO Boom. Thousands of projects launch on Ethereum.',
            descKo: 'ICO 열풍. 수천 개의 프로젝트가 이더리움 기반으로 런칭.',
            detailsEn: 'The ERC-20 token standard enabled the ICO boom, where startups raised billions of dollars in ETH. While it showcased Ethereum\'s utility, it also led to network congestion and regulatory scrutiny.',
            detailsKo: 'ERC-20 토큰 표준은 스타트업들이 수십억 달러의 ETH를 모금하는 ICO 붐을 가능하게 했습니다. 이는 이더리움의 유용성을 보여주었지만 네트워크 혼잡과 규제 당국의 조사를 초래하기도 했습니다.',
            type: 'market'
        },
        {
            year: 2020, month: '12',
            descEn: 'Beacon Chain launched. The first step towards Proof of Stake.',
            descKo: '비콘 체인 가동. 지분 증명(PoS) 전환을 위한 첫 걸음.',
            detailsEn: 'The Beacon Chain introduced Proof-of-Stake to the Ethereum ecosystem, running parallel to the main Proof-of-Work chain. It allowed users to stake ETH and prepared the network for future scalability upgrades.',
            detailsKo: '비콘 체인은 이더리움 생태계에 지분 증명(PoS)을 도입하여 기존 작업 증명 체인과 병행 운영되었습니다. 이를 통해 사용자들은 ETH를 스테이킹할 수 있게 되었고 향후 확장성 업그레이드를 위한 준비를 마쳤습니다.',
            type: 'tech'
        },
        {
            year: 2021, month: '08',
            descEn: 'London Hard Fork (EIP-1559). ETH starts burning mechanism.',
            descKo: '런던 하드포크(EIP-1559). 수수료 소각 메커니즘 도입.',
            detailsEn: 'EIP-1559 revolutionized Ethereum\'s fee market by burning a portion of every transaction fee. This made ETH deflationary during periods of high network activity and improved fee predictability.',
            detailsKo: 'EIP-1559는 모든 거래 수수료의 일부를 소각함으로써 이더리움 수수료 시장에 혁명을 일으켰습니다. 이는 네트워크 활동이 활발할 때 ETH를 디플레이션 자산으로 만들고 수수료 예측 가능성을 개선했습니다.',
            type: 'tech'
        },
        {
            year: 2022, month: '09',
            descEn: 'The Merge. Ethereum successfully switches to Proof of Stake (99.9% energy reduction).',
            descKo: '더 머지(The Merge). 지분 증명(PoS) 전환 성공 (에너지 99.9% 절감).',
            detailsEn: 'The Merge seamlessly joined the execution layer with the Beacon Chain, ending Proof-of-Work. This reduced Ethereum\'s energy consumption by ~99.95%, addressing major environmental concerns.',
            detailsKo: '더 머지(The Merge)는 실행 레이어와 비콘 체인을 완벽하게 통합하여 작업 증명을 종료했습니다. 이로 인해 이더리움의 에너지 소비가 약 99.95% 감소하여 주요 환경 우려를 해소했습니다.',
            type: 'milestone'
        },
        {
            year: 2023, month: '04',
            descEn: 'Shapella Upgrade. Staked ETH withdrawals enabled.',
            descKo: '샤펠라 업그레이드. 스테이킹된 이더리움 인출 가능.',
            detailsEn: 'The Shapella upgrade allowed validators to finally withdraw their staked ETH and rewards. Contrary to fears of a sell-off, it increased confidence in the staking model, leading to more ETH being staked.',
            detailsKo: '샤펠라 업그레이드를 통해 검증자들은 마침내 스테이킹된 ETH와 보상을 인출할 수 있게 되었습니다. 매도 우려와 달리 이는 스테이킹 모델에 대한 신뢰를 높여 더 많은 ETH가 스테이킹되는 결과를 낳았습니다.',
            type: 'tech'
        },
        {
            year: 2024, month: '03',
            descEn: 'Dencun Upgrade (Proto-Danksharding). L2 fees drop significantly.',
            descKo: '덴쿤 업그레이드. 레이어2 수수료 대폭 절감.',
            detailsEn: '"Proto-Danksharding" (EIP-4844) introduced "blobs" of data that drastically reduced transaction costs for Layer 2 networks like Arbitrum and Optimism, making Ethereum scalable for mass adoption.',
            detailsKo: '"Proto-Danksharding"(EIP-4844)은 데이터 "블롭"을 도입하여 아비트럼, 옵티미즘과 같은 레이어 2 네트워크의 거래 비용을 획기적으로 낮추었으며, 이더리움의 대중적 채택을 위한 확장성을 확보했습니다.',
            type: 'tech'
        },
        {
            year: 2024, month: '05',
            descEn: 'SEC approves Spot Ethereum ETFs.',
            descKo: '미국 SEC, 이더리움 현물 ETF 승인.',
            detailsEn: 'In a surprise move, the SEC approved key regulatory filings for Spot Ethereum ETFs, classifying ETH definitively as a commodity rather than a security.',
            detailsKo: 'SEC는 이더리움 현물 ETF에 대한 주요 규제 서류를 승인하며 시장을 놀라게 했습니다. 이는 ETH를 증권이 아닌 상품으로 명확히 분류한 중요한 사건입니다.',
            type: 'market'
        },
        {
            year: 2025, month: '07',
            descEn: 'Ethereum 10th Anniversary.',
            descKo: '이더리움 탄생 10주년.',
            detailsEn: 'Celebrating a decade of innovation, Ethereum has evolved from a developer experiment into the global backbone of decentralized finance (DeFi), NFTs, and stablecoins.',
            detailsKo: '혁신의 10년을 기념하며, 이더리움은 개발자의 실험에서 디파이(DeFi), NFT, 스테이블코인의 글로벌 중추로 성장했습니다.',
            type: 'milestone'
        },
        {
            year: 2025, month: '12',
            descEn: 'Scheduled: Fusaka Upgrade (PeerDAS & Blob capacity increase).',
            descKo: '예정: Fusaka 업그레이드 (데이터 가용성 확장).',
            detailsEn: 'The upcoming Fusaka upgrade is expected to implement PeerDAS, further increasing data availability and blob capacity, paving the way for millions of transactions per second on L2s.',
            detailsKo: '다가오는 Fusaka 업그레이드는 PeerDAS를 구현하여 데이터 가용성과 블롭 용량을 더욱 확장할 것으로 예상됩니다. 이는 레이어 2에서 초당 수백만 건의 거래를 처리할 수 있는 길을 열어줄 것입니다.',
            type: 'tech'
        },
    ],
    SOL: [
        {
            year: 2017, month: '11',
            descEn: 'Anatoly Yakovenko publishes Proof of History (PoH) whitepaper.',
            descKo: '아나톨리 야코벤코가 역사 증명(PoH) 백서를 발표.',
            detailsEn: 'Anatoly Yakovenko introduced Proof of History, a novel clock for distributed systems. This innovation allows the network to order transactions without waiting for global consensus on time, enabling immense speed.',
            detailsKo: '아나톨리 야코벤코는 분산 시스템을 위한 새로운 시계인 역사 증명(Proof of History)을 소개했습니다. 이 혁신은 네트워크가 시간에 대한 글로벌 합의를 기다리지 않고 거래를 정렬할 수 있게 하여 엄청난 속도를 가능하게 했습니다.',
            type: 'milestone'
        },
        {
            year: 2020, month: '03',
            descEn: 'Mainnet Beta Launch. High speed, low cost promise.',
            descKo: '메인넷 베타 런칭. 고속, 저비용 블록체인의 시작.',
            detailsEn: 'Solana launched its Mainnet Beta, delivering on its promise of high throughput and sub-second finality. It quickly attracted developers looking for an alternative to Ethereum\'s high gas fees.',
            detailsKo: '솔라나는 메인넷 베타를 런칭하며 높은 처리량과 1초 미만의 최종성을 약속했습니다. 이더리움의 높은 가스비에 대한 대안을 찾던 개발자들을 빠르게 끌어모았습니다.',
            type: 'tech'
        },
        {
            year: 2021, month: '08',
            descEn: 'NFT Summer. Degenerate Ape Academy launches, SOL prices skyrocket.',
            descKo: 'NFT 썸머. Degenerate Ape Academy 등 NFT 생태계 폭발적 성장.',
            detailsEn: 'The launch of Degenerate Ape Academy marked the start of "Solana NFT Summer". The low fees made NFTs accessible to retail, driving SOL price from $30 to nearly $260.',
            detailsKo: 'Degenerate Ape Academy의 런칭은 "솔라나 NFT 썸머"의 시작을 알렸습니다. 저렴한 수수료 덕분에 개인 투자자들이 NFT에 쉽게 접근할 수 있었고, 이로 인해 SOL 가격은 30달러에서 260달러 가까이 급등했습니다.',
            type: 'market'
        },
        {
            year: 2022, month: '11',
            descEn: 'FTX Collapse hits Solana hard due to Alameda research ties. Price drops below $10.',
            descKo: 'FTX 및 알라메다 사태로 직격탄. 가격이 10달러 아래로 폭락.',
            detailsEn: 'Solana faced an existential crisis as its biggest backers, FTX and Alameda, collapsed. The ecosystem lost massive liquidity, and the token plummeted 96% from its peak, leading many to declare it "dead".',
            detailsKo: '최대 후원자였던 FTX와 알라메다가 붕괴하면서 솔라나는 존폐 위기에 직면했습니다. 생태계는 막대한 유동성을 잃었고 토큰 가격은 고점 대비 96% 폭락하며 많은 이들이 "끝났다"고 평가했습니다.',
            type: 'drama'
        },
        {
            year: 2023, month: '04',
            descEn: 'Solana Saga Mobile phone launched. Web3 in your pocket.',
            descKo: '솔라나 사가(Saga) 스마트폰 출시. 모바일 Web3 시대.',
            detailsEn: 'Solana Mobile launched Saga, an Android phone with a built-in "Seed Vault" for crypto security. It was a pioneering move to integrate Web3 deeply into mobile hardware.',
            detailsKo: '솔라나 모바일은 암호화폐 보안을 위한 "시드 볼트"가 내장된 안드로이드 폰인 사가(Saga)를 출시했습니다. 이는 Web3를 모바일 하드웨어에 깊이 통합하려는 선구적인 움직임이었습니다.',
            type: 'tech'
        },
        {
            year: 2023, month: '12',
            descEn: 'Phoenix rise. Ecosystem recovers, Jito airdrop revives community.',
            descKo: '부활. 생태계 회복 및 Jito 에어드랍으로 커뮤니티 활기.',
            detailsEn: 'Rising from the ashes, Solana staged a massive recovery. The Jito liquids staking airdrop injected hundreds of millions in value into the community, reigniting DeFi activity and sentiment.',
            detailsKo: '잿더미 속에서 부활한 솔라나는 엄청난 회복세를 보였습니다. 지토(Jito) 유동성 스테이킹 에어드랍은 커뮤니티에 수억 달러의 가치를 주입하며 디파이 활동과 투자 심리를 되살렸습니다.',
            type: 'market'
        },
        {
            year: 2025, month: '06',
            descEn: 'Projected: Firedancer (New Validator Client) full launch.',
            descKo: '예상: 파이어댄서(Firedancer) 차세대 검증 클라이언트 도입.',
            detailsEn: 'Firedancer, a new validator client built by Jump Crypto, is expected to launch fully. It promises to theoretically boost Solana\'s throughput to over 1 million TPS, eliminating network outages.',
            detailsKo: '점프 크립토가 개발한 새로운 검증 클라이언트인 파이어댄서가 정식 출시될 예정입니다. 이는 이론적으로 솔라나의 처리 속도를 100만 TPS 이상으로 높여 네트워크 중단 문제를 해결할 것으로 기대됩니다.',
            type: 'tech'
        },
    ],
    XRP: [
        {
            year: 2012, month: '06',
            descEn: 'XRP Ledger launched by Jed McCaleb, Arthur Britto, and David Schwartz.',
            descKo: '제드 맥칼렙 등이 XRP 레저(Ledger)를 런칭함.',
            detailsEn: 'The founders launched the XRP Ledger to create a more efficient alternative to Bitcoin for global payments. It introduced a consensus protocol that doesn\'t rely on energy-intensive mining.',
            detailsKo: '창립자들은 비트코인을 대체할 더 효율적인 글로벌 결제 수단으로 XRP 레저를 런칭했습니다. 이는 에너지 집약적인 채굴에 의존하지 않는 합의 프로토콜을 도입했습니다.',
            type: 'tech'
        },
        {
            year: 2012, month: '09',
            descEn: 'OpenCoin (later Ripple Labs) founded.',
            descKo: '오픈코인(이후 리플 랩스) 설립.',
            detailsEn: 'Chris Larsen joined the team to found OpenCoin, which would later be renamed Ripple Labs. The company aimed to work with banks to facilitate instant, low-cost cross-border payments.',
            detailsKo: '크리스 라슨이 팀에 합류하여 오픈코인을 설립했으며, 이는 나중에 리플 랩스로 이름을 바꿨습니다. 이 회사는 은행과 협력하여 즉각적이고 저렴한 국경 간 결제를 촉진하는 것을 목표로 했습니다.',
            type: 'milestone'
        },
        {
            year: 2017, month: '12',
            descEn: 'Massive Rally to $3.84 ATH during the crypto bubble.',
            descKo: '크립토 거품 당시 3.84달러 사상 최고가 경신.',
            detailsEn: 'XRP saw an unprecedented rally, briefly becoming the second-largest cryptocurrency by market cap. The surge was fueled by partnerships with banks and general market euphoria.',
            detailsKo: 'XRP는 전례 없는 급등을 기록하며 잠시 시가총액 2위 암호화폐에 오르기도 했습니다. 은행과의 파트너십 소식과 시장의 전반적인 열기가 상승세를 이끌었습니다.',
            type: 'market'
        },
        {
            year: 2020, month: '12',
            descEn: 'SEC Lawsuit filed against Ripple Labs alleging unregistered securities.',
            descKo: 'SEC가 리플 랩스를 상대로 미등록 증권 혐의 소송 제기.',
            detailsEn: 'The SEC sued Ripple Labs and its executives, claiming raising $1.3 billion through XRP sales constituted an illegal securities offering. This caused many US exchanges to delist XRP.',
            detailsKo: 'SEC는 리플 랩스와 경영진이 XRP 판매를 통해 13억 달러를 모금한 것이 불법 증권 공모에 해당한다며 소송을 제기했습니다. 이로 인해 많은 미국 거래소가 XRP를 상장 폐지했습니다.',
            type: 'drama'
        },
        {
            year: 2023, month: '07',
            descEn: 'Judge TORRES rules XRP is NOT a security in secondary sales.',
            descKo: '토레스 판사 "XRP 2차 시장 판매는 증권 아니다" 판결.',
            detailsEn: 'In a landmark victory, Judge Analisa Torres ruled that programmatic sales of XRP to the public were not securities transactions. The price of XRP nearly doubled within hours.',
            detailsKo: '기념비적인 승리 속에서 아날리사 토레스 판사는 대중을 대상으로 한 XRP의 프로그래밍 판매가 증권 거래가 아니라고 판결했습니다. 이 소식에 XRP 가격은 몇 시간 만에 거의 두 배로 뛰었습니다.',
            type: 'milestone'
        },
        {
            year: 2025, month: '12',
            descEn: '"Resurrection Year". Momentum builds for Spot ETF approval.',
            descKo: '"부활의 해". 현물 ETF 승인에 대한 기대감 고조.',
            detailsEn: 'Following the legal clarity, investment firms began filing for Spot XRP ETFs. The market anticipates approval, which would fully reintegrate XRP into the US financial system.',
            detailsKo: '법적 불확실성이 해소되자 투자 회사들은 XRP 현물 ETF 신청을 시작했습니다. 시장은 승인을 예상하며, 이는 XRP가 미국 금융 시스템에 완전히 복귀하는 계기가 될 것입니다.',
            type: 'market'
        },
    ],
    BCH: [
        {
            year: 2017, month: '08',
            descEn: 'The Hard Fork. Bitcoin Cash born from the Blocksize War (8MB limit).',
            descKo: '하드포크. 블록 크기 전쟁(Blocksize War) 끝에 비트코인 캐시 탄생 (8MB).',
            detailsEn: 'Culminating years of debate over scalability, the "Big Blockers" (led by Roger Ver and Jihan Wu) forked from Bitcoin to create Bitcoin Cash. They increased the block size limit to 8MB to enable cheaper, faster transactions as "Peer-to-Peer Electronic Cash".',
            detailsKo: '확장성에 대한 수년간의 논쟁 끝에 로저 버와 우지한이 이끄는 "빅 블로커" 진영이 비트코인에서 하드포크하여 비트코인 캐시를 창시했습니다. 그들은 "P2P 전자 화폐"로서 더 싸고 빠른 거래를 위해 블록 크기 제한을 8MB로 늘렸습니다.',
            type: 'milestone'
        },
        {
            year: 2017, month: '11',
            descEn: 'Operation Dragon Slayer. The coordinated attempt to "kill" Bitcoin.',
            descKo: '드래곤 슬레이어 작전(Operation Dragon Slayer). 비트코인을 "죽이기" 위한 조직적 시도.',
            detailsEn: 'Rumored to be orchestrated by Roger Ver and Jihan Wu, "Operation Dragon Slayer" aimed to flip the market cap of BCH and BTC. The plan allegedly involved a massive pump of BCH combined with a coordinated shift of mining power to "starve" the Bitcoin network, triggering a "death spiral" of unconfirmed transactions and sky-high fees. BTC survived, but the event remains legendary.',
            detailsKo: '로저 버와 우지한이 주도한 것으로 알려진 "드래곤 슬레이어 작전"은 BCH가 BTC의 시가총액을 추월(Flippening)하려는 시도였습니다. 이 계획은 BCH의 대규모 펌핑과 동시에 채굴력을 BCH로 이동시켜 비트코인 네트워크를 "굶겨(Starve)" 고사시키는 것이었습니다. 미확인 거래 폭증과 수수료 급등으로 BTC는 위기를 맞았으나 결국 생존했습니다.',
            type: 'drama'
        },
        {
            year: 2017, month: '12',
            descEn: 'Coinbase Listing & Insider Scandal. Hits ATH near $4,000.',
            descKo: '코인베이스 기습 상장과 내부자 거래 논란. 4,000달러 육박 최고가.',
            detailsEn: 'Coinbase surprisingly enabled BCH trading, causing the price to skyrocket instantly. Accusations of insider trading emerged as the price pumped before the announcement, leading to investigations and lawsuits.',
            detailsKo: '코인베이스가 예고 없이 BCH 거래를 지원하자 가격이 순식간에 폭등했습니다. 발표 전 가격이 급등한 것에 대해 내부자 거래 의혹이 제기되었고, 이는 조사와 소송으로 이어졌습니다.',
            type: 'market'
        },
        {
            year: 2018, month: '11',
            descEn: 'The Hash War (BCH vs BSV). "Satoshi\'s Vision" split crashes the market.',
            descKo: '해시 전쟁 (BCH 대 BSV). 시장을 붕괴시킨 최악의 내전.',
            detailsEn: 'A bitter ideological split led to a war between Roger Ver\'s Bitcoin ABC (BCH) and Craig Wright\'s Bitcoin SV (BSV). Both sides burned millions in electricity to attack each other. The chaos triggered a global crypto market crash, sending BTC to $3,000.',
            detailsKo: '이념적 갈등으로 로저 버의 Bitcoin ABC(BCH)와 크레이그 라이트의 Bitcoin SV(BSV) 간에 전쟁이 발발했습니다. 양측은 서로를 공격하기 위해 수백만 달러의 전력을 낭비했으며, 이 혼란은 글로벌 크립토 시장 붕괴를 촉발하여 BTC를 3,000달러까지 끌어내렸습니다.',
            type: 'drama'
        },
        {
            year: 2020, month: '11',
            descEn: 'Block Tax Revolt. BCH rejects central funding tax, splits from ABC.',
            descKo: '블록 보상 세금("IFP") 거부. 커뮤니티가 중앙화를 막아냄.',
            detailsEn: 'Lead developer Amaury Séchet proposed an 8% tax on mining rewards to fund development. The community and miners revolted against this centralization, forking Amaury out (who formed eCash/XEC), ensuring BCH remained decentralized.',
            detailsKo: '수석 개발자 아마우리 세쳇이 개발 자금 조달을 위해 채굴 보상의 8%를 세금으로 걷자는 제안을 했습니다. 커뮤니티와 채굴자들은 이러한 중앙화 시도에 반발하여 아마우리를 축출(eCash/XEC로 분리)하고 BCH의 탈중앙성을 지켜냈습니다.',
            type: 'tech'
        },
        {
            year: 2023, month: '05',
            descEn: 'CashTokens Upgrade. Smart Contracts & DeFi on Bitcoin Cash.',
            descKo: '캐시토큰(CashTokens) 업그레이드. 비트코인 캐시 위에서 디파이 구현.',
            detailsEn: 'The CashTokens hard fork enabled native token issuance (fungible & NFTs) and advanced smart contracts on BCH. This unlocked potential for DEXs and DeFi applications while maintaining low fees.',
            detailsKo: '캐시토큰 하드포크는 BCH에서 기본 토큰 발행(대체 가능 및 NFT)과 고급 스마트 컨트랙트를 가능하게 했습니다. 이는 저렴한 수수료를 유지하면서 DEX 및 디파이 애플리케이션의 잠재력을 열어주었습니다.',
            type: 'tech'
        },
        {
            year: 2024, month: '04',
            descEn: '2nd Halving. Reward drops to 3.125 BCH.',
            descKo: '2번째 반감기. 채굴 보상 3.125 BCH로 감소.',
            detailsEn: 'BCH underwent its second halving, reducing the block reward. While price pumped leading up to it, the event also brought attention to the long-term sustainability of the network\'s security budget.',
            detailsKo: 'BCH는 두 번째 반감기를 겪으며 블록 보상이 줄어들었습니다. 이를 앞두고 가격이 상승했지만, 이 사건은 네트워크 보안 예산의 장기적 지속 가능성에 대한 관심을 불러일으켰습니다.',
            type: 'milestone'
        },
    ],
    DOGE: [
        {
            year: 2013, month: '12',
            descEn: 'Created as a joke by Billy Markus and Jackson Palmer.',
            descKo: '빌리 마커스와 잭슨 팔머가 장난(Meme)으로 창시.',
            detailsEn: 'Dogecoin was created in just a few hours as a satire on the sudden proliferation of altcoins. It featured the popular "Doge" Shiba Inu meme, intending to be fun and lighthearted.',
            detailsKo: '도지코인은 우후죽순 생겨나는 알트코인들을 풍자하기 위해 단 몇 시간 만에 만들어졌습니다. 인기 있는 시바견 "도지" 밈을 차용하여 재미있고 가벼운 분위기를 의도했습니다.',
            type: 'milestone'
        },
        {
            year: 2014, month: '01',
            descEn: 'Community raises $30k for Jamaican Bobsled team.',
            descKo: '커뮤니티가 자메이카 봅슬레이 팀 후원금 3만 달러 모금.',
            detailsEn: 'The Dogecoin community rallied to raise over $30,000 to send the Jamaican Bobsled Team to the Sochi Winter Olympics. This cemented Dogecoin\'s reputation as a "generous community" coin.',
            detailsKo: '도지코인 커뮤니티는 자메이카 봅슬레이 팀을 소치 동계 올림픽에 보내기 위해 3만 달러 이상을 모금했습니다. 이 사건은 "관대한 커뮤니티" 코인이라는 도지코인의 평판을 굳혔습니다.',
            type: 'drama'
        },
        {
            year: 2021, month: '01',
            descEn: 'Elon Musk & Reddit mania triggers massive pump.',
            descKo: '일론 머스크와 레딧(Reddit)발 밈 열풍으로 대폭등.',
            detailsEn: 'Following the GameStop saga, r/SatoshiStreetBets and Elon Musk began promoting Dogecoin. Tweets like "Doge" from Musk sent the price vertical.',
            detailsKo: '게임스톱 사태 이후 r/SatoshiStreetBets와 일론 머스크가 도지코인을 홍보하기 시작했습니다. 머스크의 "Doge"라는 트윗 한 방에 가격이 수직 상승했습니다.',
            type: 'market'
        },
        {
            year: 2021, month: '05',
            descEn: 'ATH $0.73 on SNL night. "The People\'s Crypto".',
            descKo: 'SNL 방영일 0.73달러 최고점 달성. "인민의 코인".',
            detailsEn: 'Dogecoin hit its all-time high just before Elon Musk\'s appearance on Saturday Night Live. However, the "sell the news" event caused a crash when he jokingly called it a "hustle".',
            detailsKo: '도지코인은 일론 머스크의 SNL 출연 직전 사상 최고가를 기록했습니다. 하지만 그가 농담조로 "사기(hustle)"라고 언급하자 "뉴스에 팔아라" 심리가 발동해 가격이 폭락했습니다.',
            type: 'market'
        },
        {
            year: 2023, month: '04',
            descEn: 'Twitter logo briefly changed to Doge.',
            descKo: '트위터 로고가 잠시 도지(Doge)로 변경됨.',
            detailsEn: 'In a surprise move, Elon Musk temporarily replaced the Twitter bird logo with the Doge mascot. The price surged over 30% instantly, showcasing the meme\'s enduring power.',
            detailsKo: '깜짝 이벤트로 일론 머스크는 트위터의 파랑새 로고를 잠시 도지 마스코트로 교체했습니다. 가격은 순식간에 30% 이상 급등하며 밈의 지속적인 파급력을 보여주었습니다.',
            type: 'drama'
        },
    ]
};

export default function HistoryPage() {
    const { lang } = useLanguage();
    const t = TRANSLATIONS[lang];
    const [selectedCoin, setSelectedCoin] = useState('BTC');
    const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);

    const historyData = COIN_HISTORY[selectedCoin] || [];
    const coinInfo = COIN_INFO[selectedCoin];

    const getBadgeLabel = (type: HistoryEvent['type']) => {
        if (lang === 'en') {
            switch (type) {
                case 'milestone': return 'Milestone';
                case 'tech': return 'Technology';
                case 'market': return 'Market';
                case 'drama': return 'Drama';
                default: return 'Other';
            }
        }
        switch (type) {
            case 'milestone': return '역사적 사건';
            case 'tech': return '기술 혁신';
            case 'market': return '시장 이슈';
            case 'drama': return '사건/사고';
            default: return '기타';
        }
    };

    const getBadgeColor = (type: HistoryEvent['type']) => {
        switch (type) {
            case 'milestone': return 'bg-yellow-900/40 text-yellow-500 border-yellow-700';
            case 'tech': return 'bg-blue-900/40 text-blue-500 border-blue-700';
            case 'market': return 'bg-green-900/40 text-green-500 border-green-700';
            case 'drama': return 'bg-red-900/40 text-red-500 border-red-700';
        }
    };

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
            <header className="w-full max-w-4xl mb-8 flex flex-col items-center text-center gap-4">
                <Link href="/" className="self-start hover:opacity-80 transition-opacity">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
                        &larr; {t.common.back}
                    </h1>
                </Link>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-4xl md:text-5xl font-black mb-2">{t.history.title}</h2>
                    <p className="text-gray-500">{t.history.subtitle}</p>
                </motion.div>
            </header>

            {/* Coin Selector */}
            <div className="w-full max-w-4xl flex justify-center gap-4 mb-4 overflow-x-auto pb-4">
                {['BTC', 'ETH', 'SOL', 'XRP', 'BCH', 'DOGE'].map((sym) => (
                    <button
                        key={sym}
                        onClick={() => setSelectedCoin(sym)}
                        className={`px-6 py-3 rounded-2xl font-black text-xl transition-all border-2 ${selectedCoin === sym
                            ? 'bg-white text-black border-white scale-110 shadow-xl'
                            : 'bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-600'
                            }`}
                    >
                        {sym}
                    </button>
                ))}
            </div>

            {/* Coin Introduction (New) */}
            {coinInfo && (
                <motion.div
                    key={selectedCoin} // Re-animate on coin change
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-4xl bg-gray-900/50 border border-gray-800 rounded-3xl p-6 md:p-8 mb-16 text-center shadow-lg"
                >
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-4">
                        {lang === 'ko' ? coinInfo.titleKo : coinInfo.titleEn}
                    </h3>
                    <p className="text-gray-300 leading-relaxed md:text-lg whitespace-pre-line">
                        {lang === 'ko' ? coinInfo.descKo : coinInfo.descEn}
                    </p>
                </motion.div>
            )}

            <div className="w-full max-w-3xl relative">
                {/* Timeline Line */}
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-gray-800 -translate-x-1/2"></div>

                {historyData.length > 0 ? (
                    historyData.map((event, index) => (
                        <motion.div
                            key={`${selectedCoin}-${index}`}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`flex flex-col md:flex-row items-center gap-8 mb-12 relative ${index % 2 === 0 ? 'md:flex-row-reverse' : ''
                                }`}
                        >
                            {/* Dot */}
                            <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-blue-500 rounded-full border-4 border-black -translate-x-1/2 z-10"></div>

                            {/* Content */}
                            <div className="w-full md:w-[calc(50%-2rem)] pl-12 md:pl-0">
                                <div
                                    onClick={() => setSelectedEvent(event)}
                                    className={`bg-gray-900 p-6 rounded-3xl border border-gray-800 hover:border-gray-500 hover:bg-gray-800 transition-all cursor-pointer group ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'
                                        }`}>
                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-3 ${getBadgeColor(event.type)}`}>
                                        {getBadgeLabel(event.type)}
                                    </div>
                                    <div className="text-3xl font-black text-gray-200 mb-2 group-hover:text-white transition-colors">
                                        {event.year} <span className="text-lg text-gray-500 font-medium">.{event.month}</span>
                                    </div>
                                    <p className="text-gray-400 font-medium leading-relaxed group-hover:text-gray-300">
                                        {lang === 'ko' ? event.descKo : event.descEn}
                                    </p>
                                    <div className="mt-4 text-xs text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        {lang === 'ko' ? '클릭하여 자세히 보기 →' : 'Click for details →'}
                                    </div>
                                </div>
                            </div>

                            {/* Empty space for alignment */}
                            <div className="hidden md:block w-[calc(50%-2rem)]"></div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-gray-900/30 rounded-3xl border-dashed border-2 border-gray-800">
                        <p className="text-gray-500">{t.history.noHistory}</p>
                    </div>
                )}

                {/* Ongoing Node */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12 relative">
                    <div className="absolute left-4 md:left-1/2 w-4 h-4 bg-green-500 rounded-full border-4 border-black -translate-x-1/2 z-10 animate-pulse"></div>
                    <div className="w-full text-center pl-12 md:pl-0 pt-4">
                        <span className="text-green-500 font-bold tracking-widest text-xs uppercase">{t.history.ongoing}</span>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>

                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-4 ${getBadgeColor(selectedEvent.type)}`}>
                            {getBadgeLabel(selectedEvent.type)}
                        </div>

                        <h3 className="text-4xl font-black mb-1">
                            {selectedEvent.year}.{selectedEvent.month}
                        </h3>

                        <div className="prose prose-invert max-w-none mt-6">
                            <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-line">
                                {lang === 'ko' ? selectedEvent.detailsKo : selectedEvent.detailsEn}
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-800 flex justify-end">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                {lang === 'ko' ? '닫기' : 'Close'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </main>
    );
}
