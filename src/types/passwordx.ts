// src/types/passwordx.ts
// TypeScript types for the PasswordX tool

/** Options for password generation */
export interface PasswordOptions {
  /** Desired length of the password (usually 4-128) */
  length: number;
  /** Whether to include uppercase letters (A-Z) */
  includeUppercase: boolean;
  /** Whether to include lowercase letters (a-z) */
  includeLowercase: boolean;
  /** Whether to include numerical digits (0-9) */
  includeNumbers: boolean;
  /** Whether to include special characters (!@#$%^&* etc.) */
  includeSymbols: boolean;
}

/** Strength score from 0 (very weak) to 5 (excellent) */
export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4 | 5;

/** UI data for displaying strength levels */
export interface StrengthLevelInfo {
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Excellent';
  color: string;
  text: string;
}

/** State shape managed by usePasswordX hook (if one exists/is created) */
export interface PasswordXState {
  password: string;
  options: PasswordOptions;
  strength: PasswordStrengthScore;
  isProcessing: boolean;
}
