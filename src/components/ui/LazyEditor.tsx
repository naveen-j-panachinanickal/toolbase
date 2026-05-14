import dynamic from 'next/dynamic';
import React from 'react';
import type { EditorProps } from '@monaco-editor/react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full min-h-[400px] items-center justify-center bg-(--surface-overlay) text-(--text-muted) text-sm rounded-xl">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <span className="font-medium tracking-wide">Loading Editor...</span>
      </div>
    </div>
  ),
});

export const LazyEditor: React.FC<EditorProps> = (props) => {
  return <MonacoEditor {...props} />;
};
