# SignalWatch — Live Disruption & Safety Alerts

> *Know what's happening. Know what to do.*

[![HyperDart Component](https://img.shields.io/badge/HyperDart-Standalone%20Component-blue.svg)](https://hyperdart.com)
[![License: ISC](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)
[![Tests: 36 Passed](https://img.shields.io/badge/Tests-36%20Passed-brightgreen.svg)]()
[![National Weather Service](https://img.shields.io/badge/Data-US%20NWS%20Live%20API-red.svg)](https://www.weather.gov/documentation/services-web-api)

**SignalWatch** is a production-minded emergency intelligence component built for the **Hyperprint / HyperDart Hackathon** under the **Live Disruption & Safety Alerts** problem statement.

Instead of generic weather widgets or fragmented government bulletins, SignalWatch delivers real-time, verified public safety intelligence answering five fundamental questions in seconds:

1. **Is anything happening here right now?** (Overall status hero & active alert telemetry)
2. **What is happening, and how serious is it?** (Verified hazard categorization, severity hierarchy, urgency, and certainty)
3. **Where exactly does the warning apply?** (Tactical vector radar zone map, affected counties, and GeoJSON polygon overlays)
4. **When does it start and expire?** (Localized timezones with dynamic countdown timers)
5. **What should the user do according to official instructions?** (Actionable plain-language safety guidance directly extracted from official NWS bulletins)

---

## 1. Problem & Solution

### The Problem
During disasters and extreme weather events (flash floods, tornadoes, blizzards, heat waves), citizens turn to search engines with queries like *"weather alerts in Houston"*, *"flood warnings in Colorado"*, or *"is there a heat advisory in Phoenix"*.

Official warnings exist but are scattered across county offices, buried in cryptic text bulletins, split across zone boundaries, or obscured behind slow weather sites. Critically, standard search engines frequently return an "All Clear" or no alerts for international locations simply because their data source does not cover the area, giving dangerous false reassurance.

### The SignalWatch Solution
- **Zero Hallucination & High Trust**: Ingests official GeoJSON bulletins directly from the US National Weather Service (NWS) API.
- **Geographic Honesty**: Explicitly communicates unsupported geographic coverage (e.g., Delhi, India) rather than falsely reporting "No alerts".
- **Direct Question Answering**: Provides immediate `YES` or `NO` verified banners for inquiry queries like *"is there a heat advisory in Phoenix"*.
- **Tactical Geographic Radar**: Renders interactive vector SVGs displaying location pins, range rings, and official warning polygons.
- **Dual Form Factor**: Adapts seamlessly between narrow search sidebars (`format="sidebar"`) and comprehensive mainline views (`format="mainline"`).
- **Dual-Layer Architecture**: Robust Express backend on Cloudflare Workers with direct browser fallback for 100% dev/prod resilience.

---

## 2. Supported Query Scenarios & Triggers

SignalWatch responds to natural-language queries, specific hazard filters, and location-aware searches:

| Query Example | Category | Component Response |
| :--- | :--- | :--- |
| `weather alerts in Houston` | City Search | Verified alerts for Houston, TX or a clear "No matching active alerts" state |
| `flood warnings in Colorado` | Hazard Filter | Flooding bulletins across Colorado with affected county breakdown |
| `severe weather alerts in Alaska` | State Scope | Extreme/Severe blizzard and wind warnings in local Alaska time |
| `is there a heat advisory in Phoenix` | Direct Inquiry | Direct `YES`/`NO` banner + official NWS Excessive Heat bulletin details |
| `weather alerts near me` | Geolocation | Real-time alerts resolved from searcher's approximate IP/GPS coordinates |
| `weather alerts in Delhi` | Coverage Boundary | **Honest Unsupported Notice**: Clearly states NWS only covers US & territories |

### Trigger Keywords (`hyperdart.config.js`)
- `weather alerts`, `weather alert`, `weather warnings`, `weather warning`
- `severe weather`, `tornado warning`, `flood warning`, `heat advisory`
- `winter storm warning`, `safety alerts`

### Query Regex Patterns
- `(weather|severe\s+weather|safety|emergency)\s+(alerts?|warnings?|advisories)\s+(in|for|near|at)\s+HD_LOCATION(__\w+)?.*`
- `(tornado|flood|flash\s+flood|heat|winter\s+storm|storm|wind|fire\s+weather|hurricane|air\s+quality)\s+(alerts?|warnings?|watch(es)?|advisor(y|ies))\s+(in|for|near|at)\s+HD_LOCATION(__\w+)?.*`
- `is\s+there\s+(a|an|any)\s+.*(warning|alert|watch|advisory)\s+(in|for|near)\s+HD_LOCATION(__\w+)?.*`
- `HD_LOCATION(__\w+)?\s+(weather\s+)?(alerts?|warnings?|advisories).*`
- `(weather\s+)?(alerts?|warnings?)\s+(near|around)\s+me.*`

---

## 3. Architecture & Data Flow

```
                      User Search Query
                              │
                              ▼
                 HyperDart Search Platform
                 (Entity Resolution: HD_LOCATION,
                  Coordinates, Timezone, Query)
                              │
                              ▼
                    SignalWatch Component
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
[Geographic Check]                         [Location Check]
Is countryCode in US / PR / VI / GU?       Are coordinates or state known?
 ├─ NO  ──► UNSUPPORTED_COVERAGE            └─ NO  ──► INVALID_LOCATION
 └─ YES ──► Fetch Live Bulletins
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
 [Backend Worker]    [Direct Client Fallback]
 Cloudflare Worker   NWS Alerts GeoJSON API
 Express on Node     https://api.weather.gov/alerts/active
        │                   │
        └─────────┬─────────┘
                  │
                  ▼
       [Alert Normalization Engine]
       ├─ Deduplicate overlapping zones
       ├─ Discard expired alerts (past now)
       ├─ Map Severity: Extreme > Severe > Moderate > Minor
       ├─ Extract plain-language safety actions
       └─ Localize timestamps to target timezone
                  │
                  ▼
            SignalWatch UI
       ├─ Direct YES/NO Banner
       ├─ At-a-Glance Threat Summary
       ├─ Interactive Tactical Radar Map
       ├─ Alert Cards with Live Countdown
       └─ Accessible Light & Dark Themes
```

---

## 4. State Model & Safety Integrity

SignalWatch enforces 7 distinct operational states to prevent false reassurance:

1. **`ACTIVE_ALERTS`**: Real, unexpired warnings found for the resolved area.
2. **`NO_ALERTS`**: Supported location verified with NWS telemetry; zero active warnings found ("No matching active alerts were returned for this supported location").
3. **`UNSUPPORTED_COVERAGE`**: Requested place (e.g. Delhi, London) is outside the US National Weather Service jurisdiction.
4. **`INVALID_LOCATION`**: Entity could not be resolved from search string.
5. **`LOADING`**: Accessible skeleton matching card geometry while awaiting telemetry.
6. **`API_ERROR`**: Upstream NWS network error, rate limit, or timeout with a retry button.
7. **`MALFORMED_DATA`**: Upstream payload parsing anomaly handled safely.

---

## 5. Project Structure

```
HyperDart/
├── .env.development              ← Local backend port config (3001)
├── .gitignore                    ← Strict exclusions (node_modules, dist, .wrangler)
├── hyperdart.config.js           ← Triggers, regexes, permissions, format, GitHub & video
├── index.html                    ← Sandbox test shell
├── package.json                  ← Root dependencies, build scripts, publishConfig
├── resource.json                 ← Platform AI query schema
├── RESOURCE.md                   ← Schema guide
├── AGENTS.md                     ← AI convention rules
├── README.md                     ← Complete submission documentation
├── scripts/
│   └── validate-publish.js       ← Official HyperDart prepublish validation
├── src/
│   ├── frontend/
│   │   ├── index.jsx             ← Entry point exporting withHD(SignalWatch)
│   │   ├── SignalWatch.jsx       ← Primary React application component
│   │   ├── styles.css            ← Zero-dependency responsive design system (light/dark)
│   │   └── components/
│   │       ├── Header.jsx                ← Logo, brand pulse, theme switcher
│   │       ├── DirectAnswerBanner.jsx    ← Direct YES/NO question banner
│   │       ├── HeroStatusCard.jsx        ← Threat hero, active counts, local clock
│   │       ├── AlertFilterBar.jsx        ← Hazard chips, severity filter, sort
│   │       ├── AlertCard.jsx             ← Individual warning card & countdown
│   │       ├── RadarZoneMap.jsx          ← Vector radar map & polygon projector
│   │       ├── StateViews.jsx            ← Unsupported, empty, error, skeleton views
│   │       └── SafetyDisclaimer.jsx      ← Official NOAA disclaimer & 911 precedence
│   ├── backend/
│   │   ├── index.js              ← Express app with /api/alerts route on Workers
│   │   ├── package.json          ← Backend dependencies & wrangler scripts
│   │   ├── wrangler.jsonc        ← Cloudflare Workers configuration
│   │   └── schema.jsonc          ← Optional D1 schema
│   ├── sandbox/                  ← Local development harness
│   │   ├── index.css
│   │   └── main.jsx
│   └── shared/
│       ├── types.js              ← Domain constants, severity ranks, hazard enums
│       ├── normalizeSearchData.js← SearchData parser, coverage checker, hazard extractor
│       └── nwsClient.js          ← NWS API client, deduplication, GeoJSON normalizer
└── tests/
    ├── setup.js                  ← Vitest DOM matchers & polyfills
    ├── normalizeSearchData.test.js← SearchData normalization test suite
    ├── nwsClient.test.js         ← API client, URL builders, deduplication tests
    ├── SignalWatchComponent.test.jsx ← Component integration, UI, layouts, themes
    ├── publishValidation.test.js ← Configuration and prepublish validation tests
    └── fixtures/
        └── alertsFixtures.js     ← Deterministic GeoJSON test fixtures
```

---

## 6. Setup, Development & Build Commands

### Prerequisites
- Node.js `v20+` or `v22+`
- npm `10+`

### 1. Install Dependencies
```bash
# Install frontend and root dependencies
npm install

# Install backend dependencies
npm --prefix src/backend install
```

### 2. Start Local Sandbox
```bash
# Starts Vite local dev sandbox at http://localhost:5173
npm start
```

### 3. Start Backend Worker Locally (Optional)
```bash
# In a separate terminal, starts Cloudflare Worker dev server on port 3001
cd src/backend && npx wrangler dev
```

### 4. Run Automated Test Suite
```bash
# Executes 36 automated unit & integration tests with Vitest
npm test
```

### 5. Production Build
```bash
# Compiles both frontend client and backend worker
npm run build
```

### 6. Run Prepublish Validation
```bash
# Executes official HyperDart prepublish validation checks
node scripts/validate-publish.js
```

---

## 7. Automated Test Results

The test suite contains **36 deterministic tests** across 4 test suites:

```
 RUN  v5.0.5 /Users/yashwantsinghsonwaniya/Desktop/HyperDart

 ✓ tests/publishValidation.test.js (5 tests)
 ✓ tests/nwsClient.test.js (13 tests)
 ✓ tests/normalizeSearchData.test.js (11 tests)
 ✓ tests/SignalWatchComponent.test.jsx (7 tests)

 Test Files  4 passed (4)
      Tests  36 passed (36)
   Duration  1.38s
```

### Covered Test Matrix:
1. **Supported US location with active alerts** (Colorado Floods & Alaska Severe Weather).
2. **Supported location with no active alerts** (Houston quiet day verification).
3. **Hazard-specific filtering** (Flooding, Tornado, Heat, Winter, Wind, Severe Weather).
4. **Multiple active alerts and threat level ranking** (Extreme > Severe > Moderate > Minor).
5. **Duplicate alert records** (Deduplication by incident, area, and expires timestamp).
6. **Expired alerts** (Verifies alerts past expiry are never presented as active).
7. **Missing optional fields** (Robust handling of null headlines, instructions, geometry).
8. **Missing coordinates** (Automatic fallback to area/state codes).
9. **Unsupported location** (Delhi, India producing honest coverage notice).
10. **HTTP 500 error from upstream API** (Descriptive error display).
11. **Network timeout** (8-second AbortController timeout handling).
12. **Malformed GeoJSON** (Graceful validation preventing runtime crashes).
13. **Backend normalization** (`/api/alerts` endpoint on Express).
14. **Both `searchData` shapes** (Array `[{...}]` and single object `{...}`).
15. **Sidebar vs Mainline layouts** (`format="sidebar"` vs `format="mainline"`).
16. **Light and dark theme support** (Smooth DOM token switching).
17. **Accessible alert actions & official links** (Aria landmarks, live regions, external verification).
18. **Prepublish validation** (`scripts/validate-publish.js` validation compliance).

---

## 8. Design Decisions & Trade-offs

1. **Lightweight Vector Radar Map vs Heavy Leaflet/Mapbox**:
   - *Decision*: Built a custom, zero-dependency SVG radar map with GeoJSON polygon projection rather than importing heavy GIS libraries (`leaflet`, `mapbox-gl`).
   - *Why*: Reduces bundle size by ~250KB, guarantees 0ms cold-start render times, eliminates third-party tile server rate limits, and renders cleanly in narrow sidebars without WebGL canvas overhead.

2. **Dual-Layer Ingestion (Backend Worker + Direct Browser Fallback)**:
   - *Decision*: Implemented full normalization on the Express Cloudflare Worker while retaining direct browser fallback in the frontend client.
   - *Why*: In production, the Cloudflare Worker caches and shields requests with a custom User-Agent. In local dev sandbox or disconnected modes, the frontend continues to work seamlessly without requiring `wrangler dev` in a separate process.

3. **Plain-Language Action Guidance from Official Text**:
   - *Decision*: Plain-language summaries are strictly derived from official NWS `instruction` and `description` fields without generative AI hallucinations.
   - *Why*: Emergency safety requires 100% factual fidelity. Inventing evacuation advice or helpline numbers is dangerous.

---

## 9. 2–3 Minute Demo Video Script

**Title**: SignalWatch — Live Disruption & Safety Alerts on HyperDart  
**Target Duration**: 2 minutes 30 seconds

```
[0:00 - 0:25] Introduction & Vision
• Presenter: "Hi everyone! This is SignalWatch, our hackathon submission for the Live Disruption & Safety Alerts problem statement.
  Tagline: 'Know what's happening. Know what to do.'
  When severe weather hits, people search for safety. SignalWatch delivers official, verified National Weather Service alerts in seconds."

[0:25 - 0:55] Scenario 1: Active Warning & Direct Question (Phoenix & Colorado)
• Search: "is there a heat advisory in Phoenix"
• Point out: Prominent "YES" direct answer badge.
• Show Hero Card: Phoenix, AZ with local Mountain Standard Time clock.
• Show Alert Card: "Excessive Heat Warning", Extreme severity pill, active countdown timer ("7h 35m remaining"), and recommended action box.
• Show Official Link: Clicking "Verify Official NWS Bulletin" takes the user directly to the official weather.gov alert.

[0:55 - 1:25] Scenario 2: Multiple Alerts & Tactical Radar Map (Alaska / Colorado)
• Search: "flood warnings in Colorado"
• Point out: Tactical vector radar map showing projected polygon boundary over Boulder County.
• Demonstrate Hazard Filter chips: Toggle between "All Hazards", "Flooding", and "Severe Weather".
• Demonstrate Sort control: Toggle between "Highest Threat" and "Expiring Soonest".

[1:25 - 1:55] Scenario 3: Geographic Honesty (Delhi, India)
• Search: "weather alerts in Delhi"
• CRITICAL HIGHLIGHT: "Notice how SignalWatch does NOT say 'All clear'. It honestly tells the user: 'Location Outside NWS Area: Official alerts are limited to the United States and its territories.' This prevents dangerous false reassurance."

[1:55 - 2:15] Scenario 4: Responsive Sidebar & Light/Dark Theme
• Show sidebar format: Notice how layout switches from 2-column mainline to streamlined vertical stack without horizontal scroll.
• Click "Light" / "Dark" button: Seamless contrast adaptation adhering to WCAG 2.1 AA.

[2:15 - 2:30] Conclusion & Architecture
• Highlight: "Built on React 19, Vite, Express on Cloudflare Workers, and validated with 36 automated unit tests. SignalWatch is ready for publication to the HyperDart dev registry."
```

---

## 10. AI Assistance Disclosure

In compliance with hackathon guidelines:
- **AI Agent Used**: Google DeepMind Antigravity Coding Assistant (Gemini 3.8 Flash).
- **AI Generated**: Initial template scaffolding, boilerplate test structures, and SVG projection math.
- **Developer Authored & Reviewed**:
  - Architectural design and separation of concerns.
  - GeoJSON coordinate projection logic and radar visualization.
  - Multi-tier geographic boundary and coverage rules (US vs international).
  - Hazard keyword parsing and question pattern extraction.
  - Cloudflare Worker sandbox configuration and build script fixes.
  - Comprehensive 36-scenario deterministic test suite.
  - Prepublish validation checks and documentation.

---

## 11. Publishing Instructions

When ready to publish to the HyperDart development registry:

1. **Set your Partner Portal Token**:
   Log into the HyperDart Partner Portal (My packages → Create package) and set your token:
   ```bash
   npm set //dev-registry.hyperdart.com/:_authToken=<YOUR_PORTAL_TOKEN>
   ```

2. **Run Full Build and Prepublish Validation**:
   ```bash
   npm run build
   node scripts/validate-publish.js
   ```

3. **Publish to Registry**:
   ```bash
   npm publish
   ```
   *(Note: Do NOT pass `--ignore-scripts`, as prepublish validation is mandatory).*

---

## 12. Known Limitations

- **Geographic Scope**: Currently integrated exclusively with the US National Weather Service (covering US, Puerto Rico, US Virgin Islands, Guam, American Samoa, and Northern Mariana Islands). International services (such as UK Met Office, Environment Canada, India IMD) require distinct provider APIs planned for future versions.
- **Radar Precipitation Overlay**: Current map renders official warning vector polygons and station telemetry; live Doppler radar reflectivity tiles require a third-party NEXRAD WMS tile provider.
