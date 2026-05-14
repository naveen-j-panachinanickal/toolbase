// src/types/speed-test.ts
// TypeScript types for the Speed Test tool

/** The stage of a speed test run */
export type TestStage = 'idle' | 'ping' | 'download' | 'upload' | 'complete' | 'error';

/** Final results of a completed speed test */
export interface SpeedTestResult {
  /** Round-trip latency in milliseconds */
  ping: number;
  /** Download speed in Mbps */
  download: number;
  /** Upload speed in Mbps */
  upload: number;
}

/** Rating derived from speed test results */
export type SpeedRating = 'poor' | 'fair' | 'good' | 'excellent';

/** State shape managed by useSpeedTest */
export interface SpeedTestState {
  status: TestStage;
  results: SpeedTestResult;
  /** Live speed reading during the current stage (Mbps) */
  currentSpeed: number;
  error: string | null;
}
