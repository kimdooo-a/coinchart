'use client';

import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface InsufficientDataProps {
  title?: string;
  description?: string;
  reasons?: string[];
  lang?: 'ko' | 'en';
  className?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export function InsufficientData({
  title,
  description,
  reasons = [],
  lang = 'ko',
  className = '',
  onAction,
  actionLabel
}: InsufficientDataProps) {
  const defaultTitle = lang === 'ko' ? '데이터 부족' : 'Insufficient Data';
  const defaultDesc = lang === 'ko'
    ? '분석을 수행하려면 최소 3개 이상의 지표 신호가 필요합니다.'
    : 'At least 3 indicator signals are required for analysis.';

  return (
    <Card className={`bg-gray-900 border-orange-800/50 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl" />
            <div className="relative bg-orange-500/10 border border-orange-500/30 rounded-full p-3">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-gray-300">
            {title || defaultTitle}
          </h3>
        </div>
        <Badge variant="destructive">
          {lang === 'ko' ? '분석 불가' : 'Cannot Analyze'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-gray-500 text-sm">
          {description || defaultDesc}
        </p>

        {reasons.length > 0 && (
          <div className="pt-4 border-t border-gray-800">
            <Label className="text-orange-400 text-xs mb-2 block">
              {lang === 'ko' ? '상세 사유' : 'Details'}
            </Label>
            <ul className="text-sm text-gray-400 space-y-1.5">
              {reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      {onAction && actionLabel && (
        <CardFooter>
          <Button variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}


