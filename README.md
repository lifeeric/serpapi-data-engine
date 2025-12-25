# Intent Data Engine MVP

A lean, rule-based intent data engine for managing contact data with simple intent scoring. Built with Python (FastAPI) backend and Next.js frontend.

## Features

- **Data Sources**
  - SerpAPI integration for Google search results
  - CSV upload with automatic field mapping
  
- **Intent Scoring**
  - Rule-based scoring engine (LOW/MEDIUM/HIGH)
  - Keyword matching
  - Recency analysis
  - No AI or ML required

- **Contact Enrichment**
  - Skip-trace API integration (configurable)
  - Automatic data enrichment

- **Audience Builder**
  - Filter by industry, location, intent level, date range
  - Save and manage audience segments
  - Live preview of matching contacts

- **Export Options**
  - CSV export with custom fields
  - SHA-256 hashed emails for ad platforms
  - Webhook delivery for CRM integration

## Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Deployment**: Docker & Docker Compose

## Prerequisites

- Docker and Docker Compose
- SerpAPI API key (get one at https://serpapi.com/)
- (Optional) Skip-trace API credentials

## Quick Start

###1. Clone and Setup

```bash
cd /Users/ericr./Dev/SASS/serpapi-dashboard
```

### 2. Configure Environment Variables

Copy the backend .env file and add your SerpAPI key:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set:
```
SERPAPI_API_KEY=your_actual_serpapi_key_here
```

### 3. Start with Docker Compose

```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Backend API on http://localhost:8000
- Frontend dashboard on http://localhost:3000

### 4. Access the Application

Open your browser to: **http://localhost:3000**

## Manual Setup (Without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start PostgreSQL (ensure it's running)
# Then run migrations (if using Alembic)
# alembic upgrade head

# Start the server
python app/main.py
```

Backend will run on http://localhost:8000

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local

# Start development server
npm run dev
```

Frontend will run on http://localhost:3000

## API Documentation

Once the backend is running, visit:
- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc (ReDoc)

## Usage Guide

### 1. Import Contacts

**Option A: SerpAPI Search**
1. Go to Data Sources → SerpAPI
2. Enter a search query (e.g., "plumbing companies in Austin TX")
3. Click "Search & Import"
4. Contacts will be imported and automatically scored

**Option B: CSV Upload**
1. Go to Data Sources → CSV Upload
2. Upload a CSV file with columns: `first_name`, `last_name`, `email`, `phone`, `company`, `industry`, `city`, `state`
3. Click "Upload & Import"

### 2. View and Filter Contacts

1. Go to Contacts
2. Use filters to search by name, industry, intent level, etc.
3. View intent scores (LOW/MEDIUM/HIGH) for each contact

### 3. Build Audiences

1. Go to Audiences → Build Audience
2. Set filter criteria (industry, location, intent level)
3. Preview matching contacts
4. Save audience with a name

### 4. Export Data

1. Go to Exports
2. Choose format:
   - **CSV**: Full contact data
   - **Hashed (SHA-256)**: For Facebook/Google Ads
   - **Webhook**: Send to your CRM
3. Select audience or export all
4. Download or send

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── config.py          # Configuration
│   │   ├── database.py        # Database connection
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   ├── routers/           # API endpoints
│   │   └── utils/             # Utilities
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                   # Next.js pages
│   ├── components/            # React components
│   ├── lib/                   # Utilities and API client
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## Intent Scoring Logic

The rule-based scoring system evaluates contacts based on:

1. **Keyword Matching** (up to 0.6 points)
   - High-intent keywords: "looking for", "need", "quote", "pricing", etc.
   - Medium-intent keywords: "compare", "review", "best", "near me", etc.
   - Low-intent keywords: "what is", "how to", "diy", etc.

2. **Recency** (0.2 points)
   - Contacts added within the last 90 days get a boost

3. **Source** (0.1 points)
   - SerpAPI contacts get a boost (actively searching)

**Thresholds:**
- HIGH: Score ≥ 0.7
- MEDIUM: 0.4 ≤ Score < 0.7
- LOW: Score < 0.4

## Configuration

Edit `backend/.env` to customize:

```
# Intent scoring thresholds
INTENT_HIGH_THRESHOLD=0.7
INTENT_MEDIUM_THRESHOLD=0.4
INTENT_RECENCY_DAYS=90

# API keys
SERPAPI_API_KEY=your_key
SKIPTRACE_API_KEY=your_key  # Optional
SKIPTRACE_API_URL=https://api.provider.com/v1

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
```

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Run Tests

```bash
cd backend
pytest tests/ -v
```

## Troubleshooting

**Database connection failed:**
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`

**SerpAPI search fails:**
- Verify your `SERPAPI_API_KEY` is correct
- Check you have API credits remaining

**Frontend can't connect to backend:**
- Verify backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`

## License

Proprietary - Intent Data Engine MVP

## Support

For issues or questions, please contact the development team.
