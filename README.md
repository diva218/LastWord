# LastWord

Initial Flask scaffold for the LastWord dead man's switch mini project.

## Quick start

1. Create a virtual environment and install dependencies from `requirements.txt`.
2. Copy `.env.example` to `.env` and set local values.
3. Run the app:

```bash
python run.py
```

## Notes

- In production (`ENV=production`), configuration is loaded from AWS SSM Parameter Store.
- In local/non-production, configuration is loaded from environment variables and optional `.env`.
- Health check endpoint: `GET /health`
- Internal scan stub endpoint: `POST /internal/scan` with `X-Scan-Secret` header.
