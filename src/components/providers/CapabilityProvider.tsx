'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSystemCapabilities, CapabilityReport } from '@/utils/SystemCapabilities';

const CapabilityContext = createContext<CapabilityReport | null>(null);

export function CapabilityProvider({ children }: { children: React.ReactNode }) {
  const [report, setReport] = useState<CapabilityReport | null>(null);

  useEffect(() => {
    void getSystemCapabilities().then(setReport);
  }, []);

  return (
    <CapabilityContext.Provider value={report}>
      {children}
    </CapabilityContext.Provider>
  );
}

export function useCapabilities() {
  return useContext(CapabilityContext);
}
