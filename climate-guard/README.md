# Climate Guard — Backend

## Setup

1. Clone the repo
2. Copy `backend/.env` and fill in your `ANTHROPIC_API_KEY`
3. Run:

```bash
docker compose up --build
```

4. API available at `http://localhost:8000`
5. Docs at `http://localhost:8000/docs`

## Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/properties` | List demo properties |
| GET | `/risk?address=...` | Full risk profile for address |
| GET | `/recommendations?address=...` | Claude AI tips + insurer list |
| GET | `/trajectory?address=...` | Premium cost 2024–2028 |
| GET | `/health` | Health check |

## Test

```bash
pytest backend/tests/test_flow.py -v
```

## Demo Address

125 Ocean Drive, Miami FL 33139
