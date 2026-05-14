# Speed Test

## Overview

A browser-native internet speed test that measures your download and upload bandwidth without requiring any app installation or browser extension.

## Features

- **Download Speed**: Measures how fast data can be retrieved from a test endpoint
- **Upload Speed**: Measures how fast data can be sent from your browser
- **Latency/Ping**: Baseline round-trip time measurement
- **Live Progress**: Real-time speed graph as the test runs

## How to Use

1. Open the tool
2. Click **Start Test**
3. Wait for download and upload tests to complete
4. View your results summary

## Privacy Guarantee

- **No personal data stored** — test results exist only in your browser session
- **No account required** — completely anonymous usage
- **Open source** — you can inspect exactly what endpoints are called

## Technical Details

- **Download test**: Fetches a known-size payload and measures elapsed time
- **Upload test**: Sends a generated payload and measures elapsed time
- **Framework**: Plain TypeScript, no external speed-test SDK dependencies

## Limits

- Results depend on network conditions at time of test
- Browser overhead means results may be slightly lower than native speed test apps
- Corporate proxies or VPNs may affect accuracy
