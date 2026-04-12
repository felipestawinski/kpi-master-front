'use client';

import Sidebar from '@/components/Sidebar';
import OnboardingAssistant from '@/components/OnboardingAssistant';
import TokenUsageBar from '@/components/TokenUsageBar';
import { useEffect, useState } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
 const [showOnboarding, setShowOnboarding] = useState(false);

 // Check if the onboarding should be shown (new user who hasn't completed it)
 useEffect(() => {
  const onboardingCompleted = localStorage.getItem('onboardingCompleted');
  const isNewUser = localStorage.getItem('isNewUser');

  if (isNewUser === 'true' && !onboardingCompleted) {
   setShowOnboarding(true);
   localStorage.removeItem('isNewUser');
  }
 }, []);

 return (
    <div className="min-h-screen flex relative bg-[#0b0b0d]">

   <Sidebar />

   {/* Onboarding Assistant — rendered at layout level so it persists across pages */}
   {showOnboarding && (
    <OnboardingAssistant onDisable={() => setShowOnboarding(false)} />
   )}

   {/* Main content area */}
   <main className="relative z-10 flex-1">
    {children}
   </main>

   {/* Token usage progress bar — visible on all authenticated pages */}
   <TokenUsageBar />
  </div>
 );
}
