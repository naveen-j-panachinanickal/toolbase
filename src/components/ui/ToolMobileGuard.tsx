'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { TOOLS } from '@/config/tools.registry';
import { MobileOptimizationWarning } from './MobileOptimizationWarning';

interface ToolMobileGuardProps {
  children: React.ReactNode;
}

export function ToolMobileGuard({ children }: ToolMobileGuardProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Only show warning if on a tool page and not already dismissed for this session
    const toolRoute = pathname?.split('/')[1];
    if (!toolRoute || toolRoute === 'tools' || toolRoute === '') {
        // Not a direct tool route or it's /tools/something
        // Wait, tools are in /(tools)/ which map to /tool-id
        // e.g. /base64
    }

    // Find the tool in the registry
    // The route in the registry matches the first part of the pathname
    const tool = TOOLS.find(t => t.route === toolRoute);

    if (isMobile && tool && !tool.mobileOptimized && !dismissed) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [pathname, isMobile, dismissed]);

  return (
    <>
      {children}
      <MobileOptimizationWarning 
        isOpen={showWarning} 
        onProceed={() => {
            setShowWarning(false);
            setDismissed(true);
        }} 
      />
    </>
  );
}
