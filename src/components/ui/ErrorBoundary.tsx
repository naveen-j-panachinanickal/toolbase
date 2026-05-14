'use client';

/**
 * ErrorBoundary — Global React Error Boundary
 *
 * Catches render-time errors in any subtree and shows a friendly fallback
 * instead of a white screen. Works for tool pages and the main layout.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeTool />
 *   </ErrorBoundary>
 *
 *   <ErrorBoundary fallback={<CustomFallback />}>
 *     <SomeTool />
 *   </ErrorBoundary>
 */

import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    /** Optional custom fallback UI. Receives the error and a reset callback. */
    fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        console.error('[ErrorBoundary] Caught render error:', error, info.componentStack);
    }

    private handleReset = () => {
        this.setState({ error: null });
    };

    render(): ReactNode {
        const { error } = this.state;
        const { children, fallback } = this.props;

        if (error) {
            if (fallback) {
                return fallback(error, this.handleReset);
            }

            return (
                <div
                    role="alert"
                    className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center gap-4"
                >
                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                        <svg
                            className="w-7 h-7 text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                            />
                        </svg>
                    </div>

                    <div className="max-w-sm">
                        <h2 className="text-base font-semibold text-gray-900 mb-1">Something went wrong</h2>
                        <p className="text-sm text-gray-500 mb-1">
                            This tool encountered an unexpected error.
                        </p>
                        <details className="text-left mt-2 mb-3">
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                                Error details
                            </summary>
                            <pre className="mt-1 text-xs text-red-500 bg-red-50 rounded-lg p-3 overflow-auto max-h-32 whitespace-pre-wrap break-all">
                                {error.message}
                            </pre>
                        </details>
                        <button
                            onClick={this.handleReset}
                            className="macos-primary-button text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return children;
    }
}
