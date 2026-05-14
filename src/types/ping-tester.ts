// src/types/ping-tester.ts
// TypeScript types for the Ping Tester tool

/** Result of a single ping attempt */
export interface PingResult {
  /** Hostname or URL that was pinged */
  host: string;
  /** Round-trip latency in milliseconds, or null if the request failed */
  latency: number | null;
  /** Whether the ping succeeded or failed */
  status: 'success' | 'error' | 'timeout';
  /** ISO timestamp of when the ping was sent */
  timestamp: string;
  /** Optional error message when status is 'error' */
  errorMessage?: string;
}

/** Options controlling a ping session */
export interface PingOptions {
  /** How many ping packets to send in one session */
  packetCount: number;
  /** Delay between pings in milliseconds */
  interval: number;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/** Aggregated statistics for a completed ping session */
export interface PingStats {
  sent: number;
  received: number;
  lost: number;
  /** Percentage of packets lost (0–100) */
  lossRate: number;
  /** Minimum latency across successful pings (ms) */
  min: number;
  /** Maximum latency across successful pings (ms) */
  max: number;
  /** Average latency across successful pings (ms) */
  avg: number;
}

/** State shape managed by usePingTester */
export interface PingTesterState {
  results: PingResult[];
  isRunning: boolean;
  target: string;
  options: PingOptions;
  stats: PingStats;
}
