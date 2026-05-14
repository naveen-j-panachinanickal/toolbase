# PasswordX

## Overview

A browser-native tool for generating secure passwords and measuring their strength. Create complex, unpredictable passwords and ensure your existing passwords meet modern security standards without any data leaving your machine.

## Features

- **Password Generation**: Create passwords with customizable length and character sets (uppercase, lowercase, numbers, symbols).
- **Strength Analysis**: Real-time evaluation of password strength based on entropy, pattern recognition, and common dictionary attacks.
- **Custom Entropy**: Toggle specific character requirements to meet various platform standards.
- **Bulk Generation**: Generate multiple passwords at once for various accounts.

## How to Use

1. Adjust the slider to choose your desired password length.
2. Select character types (Symbols, Numbers, etc.) to include.
3. Click **Generate** to create a new password.
4. Input any password into the analyzer to see its strength score and suggestions for improvement.

## Privacy Guarantee

- **Zero Data Leakage**: Password generation and analysis happen entirely in your browser memory.
- **No Storage**: We never store, log, or transmit your passwords to any server.
- **Offline Capable**: Since all logic is local, the tool works even without an internet connection once loaded.

## Technical Details

- **Generation**: Uses `window.crypto.getRandomValues()` for cryptographically secure pseudo-random number generation (CSPRNG).
- **Analysis**: Implements entropy calculation and pattern matching algorithms to provide an objective strength score.
- **Framework**: Built with React and TypeScript for a fast, responsive, and type-safe experience.

## Limits

- Strength analysis provides an estimate and should be used as a guide, not a guarantee of absolute security.
- Avoid using common phrases or personal information even if the score is high.
