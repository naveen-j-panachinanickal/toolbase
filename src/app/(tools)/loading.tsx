/**
 * Loading skeleton shown while tool page JavaScript loads.
 * Uses Next.js route-level Suspense streaming so the browser
 * renders this immediately - no blank/white flash on navigation.
 */
export default function ToolLoading() {
    return (
        <div className="flex h-screen items-center justify-center bg-[#FDFDFD]">
            <div className="flex flex-col items-center gap-4">
                {/* Animated skeleton bar */}
                <div className="w-48 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
                        style={{
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.6s ease-in-out infinite',
                        }}
                    />
                </div>
                <p className="text-xs text-gray-400 font-medium tracking-wide">Loading tool…</p>
            </div>

            <style>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
        </div>
    );
}
