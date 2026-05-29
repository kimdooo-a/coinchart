// /watchlist — 관심종목 (R12 / T-A · W1)
// 기존 "준비 중" 스텁을 실기능으로 교체. 본문은 WatchlistView(클라이언트)가 담당.

import WatchlistView from '@/components/Watchlist/WatchlistView';

export const metadata = {
    title: '관심종목 - 코인·주식 커뮤니티',
    description: '관심 있는 코인과 주식을 모아 실시간 시세를 확인하세요.',
};

export default function WatchlistPage() {
    return <WatchlistView />;
}
