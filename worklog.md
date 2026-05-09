---
Task ID: 7
Agent: Main Agent
Task: Switch to JSON data, add passcode auth, add routing/navigation features, fix Leaflet

Work Log:
- Created /src/data/bsps-data.json with all 37 BSPS entries (migrated from Prisma seed data)
- Updated /src/app/api/bsps/route.ts to read from JSON instead of Prisma
- Updated /src/app/api/bsps/stats/route.ts to compute stats from JSON data
- Updated /src/app/api/bsps/[id]/route.ts to lookup by ID from JSON data
- Updated /src/app/api/bsps/dokumentasi/route.ts to use JSON data
- Created /src/app/api/auth/route.ts for passcode verification (uses ACCESS_CODE env variable)
- Updated /src/components/MapComponent.tsx with:
  - User location marker (blue circle icon)
  - Route line (dashed blue polyline) from user location to target
  - Google Maps link in popup
  - Props: userLocation, routeTarget
- Updated /src/app/page.tsx with:
  - Passcode screen (PasscodeScreen component) before dashboard
  - Auth state persisted in localStorage
  - Location panel on map with geolocation detection
  - Manual location input (lat/lng fields)
  - Route target display with Google Maps link
  - "Tampilkan Rute di Peta" button in detail panel
  - "Buka Rute Google Maps" button in detail panel
- Added ACCESS_CODE=bsps2024 to .env
- Lint passes cleanly
- All API endpoints tested and working

Stage Summary:
- Database switched from Prisma/SQLite to JSON file for Vercel compatibility
- Passcode auth added: env variable ACCESS_CODE (default: bsps2024)
- Routing feature: auto-detect location, manual input, route line on map, Google Maps navigation
- Leaflet map working with proper CSS, markers, user location, and route lines
- All 37 BSPS data entries accessible via JSON-based API
