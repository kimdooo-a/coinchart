'use client';

import React from 'react';
import HeroSection from '@/components/hero-section';
import DashboardGrid from '@/components/dashboard-grid';
import AboutSection from '@/components/about-section';
import FooterSection from '@/components/footer-section';
import { InvestmentQuotes } from '@/components/Stock/InvestmentQuotes';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';

export default function LandingPage() {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16">

      <HeroSection mode="dark" />

      <DashboardGrid />

      <AboutSection />

      <div className="container mx-auto px-4 py-8 mb-8">
        <InvestmentQuotes size="small" />
      </div>

      <FooterSection />

    </main>
  );
}
