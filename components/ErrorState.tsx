'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  lang?: 'ko' | 'en';
  className?: string;
}

export function ErrorState({ 
  title, 
  message, 
  onRetry,
  lang = 'ko',
  className = '' 
}: ErrorStateProps) {
  const defaultTitle = lang === 'ko' ? '오류 발생' : 'Error Occurred';
  const defaultMsg = lang === 'ko' 
    ? '분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    : 'An error occurred during analysis. Please try again later.';

  return (
    <div className={`vangogh-card p-8 text-center ${className}`} style={{ borderColor: 'var(--vangogh-error, #ef4444)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
          <div className="relative bg-red-500/10 border border-red-500/30 rounded-full p-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-300">
            {title || defaultTitle}
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {message || defaultMsg}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold rounded-full transition-all hover:scale-105 hover:shadow-lg hover:shadow-red-500/50 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              {lang === 'ko' ? '다시 시도' : 'Retry'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}







