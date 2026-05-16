# Task 3 - Batch VLM Coordinate Extraction API and Script

## Agent: full-stack-developer

## Summary
Created batch VLM analysis system for BSPS coordinate extraction with rate-limit handling and crash recovery.

## Files Created
1. `/home/z/my-project/src/app/api/bsps/vlm/batch/route.ts` - Batch VLM API route (POST + GET)
2. `/home/z/my-project/src/app/api/bsps/vlm/update-coords/route.ts` - Coordinate update API route (POST + GET)
3. `/home/z/my-project/scripts/vlm-batch-process.mjs` - Standalone batch processing script
4. `/home/z/my-project/src/data/vlm-results.json` - VLM results data file

## Key Decisions
- VLM results stored separately in `vlm-results.json` to preserve original BSPS data integrity
- Batch route skips already-analyzed entries (resumable batches)
- Coordinate update uses LLM chat completion (not VLM) to interpret VLM descriptions
- LLM receives context: address, RT/RW, VLM analysis, current coords, desa center reference
- Coordinate validation ensures estimates stay within Kecamatan Ibun bounds (-7.2 to -6.9 lat, 107.6 to 107.9 lng)
- API uses 10s delay between calls; standalone script uses 15s (configurable)
- Exponential backoff: 30s * 2^attempt on 429 rate limit errors
- Both API and script save intermediate results after each entry for crash recovery
- GET endpoints on both routes for status/preview without side effects

## API Endpoints
- `POST /api/bsps/vlm/batch` - Run batch VLM analysis, body: `{ desa: "Cibeet"|"Lampegan"|"all" }`
- `GET /api/bsps/vlm/batch` - Get current VLM results and summary
- `POST /api/bsps/vlm/update-coords` - Update coordinates using LLM, body: `{ desa?, forceUpdate? }`
- `GET /api/bsps/vlm/update-coords` - Preview what would be updated

## Script Usage
```bash
bun run scripts/vlm-batch-process.mjs
bun run scripts/vlm-batch-process.mjs --desa=Cibeet
bun run scripts/vlm-batch-process.mjs --delay=20000 --max-retries=5
bun run scripts/vlm-batch-process.mjs --force
```

## Status: COMPLETED
