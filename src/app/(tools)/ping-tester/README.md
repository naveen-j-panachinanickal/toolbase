# Ping Tester

## Overview

A browser-native network diagnostic tool that tests latency and reachability of any host or URL — no terminal, no extensions, no installs required.

## Features

- **Latency Test**: Measures round-trip response time to any host
- **Reachability Check**: Confirms whether a host is responding
- **Multi-ping**: Run multiple rounds and get min/avg/max statistics
- **History**: Keeps a log of previous ping sessions in the current window

## How to Use

1. Enter a hostname or URL (e.g. `google.com`, `api.example.com`)
2. Click **Ping** or press Enter
3. View real-time latency results

## Privacy Guarantee

- **No logging** — ping targets and results are never sent anywhere
- **No server** — requests are made directly from your browser
- **Client-only** — all logic runs as plain JavaScript in your browser tab

## Technical Details

- **Implementation**: Uses `fetch()` HEAD requests with timing to simulate ping behaviour
- **Note**: True ICMP ping is not available in browsers; this tool uses HTTP latency as a practical proxy

## Limits

- Hosts that block browser requests (strict CORS, no-fetch policies) may show as unreachable even if the server is running
- Results reflect HTTP latency, not raw ICMP network latency
