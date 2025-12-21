'use client';

import React from 'react';
import HeroSection from '@/components/hero-section';
import DashboardGrid from '@/components/dashboard-grid';
import AboutSection from '@/components/about-section';
import FooterSection from '@/components/footer-section';
import { useLanguage } from '@/context/LanguageContext';
import { TRANSLATIONS } from '@/lib/translations';

export default function LandingPage() {
  const { lang } = useLanguage();
  const t = TRANSLATIONS[lang];

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">

      <HeroSection mode="dark" />

      <DashboardGrid />

      <AboutSection />
      <FooterSection />

    </main>
  );
}
