'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

interface SubscriptionState {
  tier: SubscriptionTier;
  isLoading: boolean;
}

/**
 * 간단한 구독 상태 훅
 * 실제 구현 시 Supabase에서 사용자 구독 정보를 가져옴
 */
export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    tier: 'free',
    isLoading: true,
  });

  useEffect(() => {
    // TODO: Supabase에서 실제 구독 정보 가져오기
    // const supabase = createClient();
    // const { data: { user } } = await supabase.auth.getUser();
    // const { data: subscription } = await supabase
    //   .from('subscriptions')
    //   .select('tier')
    //   .eq('user_id', user.id)
    //   .single();
    
    // 임시: 항상 free로 설정
    setState({
      tier: 'free',
      isLoading: false,
    });
  }, []);

  return state;
}








