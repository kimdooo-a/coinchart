'use client';

import { Lock } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface PremiumLockProps {
  feature: string;
  tier?: 'pro' | 'enterprise';
  className?: string;
  lang?: 'ko' | 'en';
}

export function PremiumLock({
  feature,
  tier = 'pro',
  className = '',
  lang = 'ko'
}: PremiumLockProps) {
  return (
    <Card className={`relative overflow-hidden bg-gray-900 border-gray-800 ${className}`}>
      {/* Blur Overlay */}
      <div className="absolute inset-0 backdrop-blur-md bg-black/40 z-10 rounded-lg" />

      {/* Lock Icon & CTA */}
      <CardContent className="relative z-20 flex flex-col items-center justify-center gap-4 py-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-xl" />
          <div className="relative bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-full p-4">
            <Lock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            {tier === 'pro' ? 'PRO' : 'ENTERPRISE'}
          </Badge>
          <p className="text-sm font-semibold text-white">
            {tier === 'pro' ? (lang === 'ko' ? 'Pro 기능' : 'Pro Feature') : (lang === 'ko' ? 'Enterprise 기능' : 'Enterprise Feature')}
          </p>
          <Label className="text-gray-400 text-xs">
            {feature}
          </Label>
        </div>

        <Link href="/pricing">
          <Button variant="glow">
            {lang === 'ko'
              ? `${tier === 'pro' ? 'Pro' : 'Enterprise'}로 업그레이드`
              : `Upgrade to ${tier === 'pro' ? 'Pro' : 'Enterprise'}`
            }
          </Button>
        </Link>

        <Label className="text-gray-500 text-xs">
          {lang === 'ko' ? '이 기능은 프리미엄 전용입니다' : 'This feature is Premium only'}
        </Label>
      </CardContent>
    </Card>
  );
}
