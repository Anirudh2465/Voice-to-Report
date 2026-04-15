# 🩻 Voice-to-Report — Radiology Dictation Assistant

A mobile app that enables radiologists to **dictate reports by voice**, which are then:
1. 🎙 **Transcribed** via OpenAI Whisper
2. ✨ **Corrected** for Indian accents + medical terminology via Claude AI
3. 📋 **Formatted** using modality-specific templates (USG, CT, MRI, X-Ray)
4. 📄 **Exported** as PDF or DOCX

## Team
| Member | Role | Stack |
|---|---|---|
| **Yashwanth** | Backend & AI | FastAPI, Whisper API, Claude API |
| **Anirudh** | Mobile Frontend | React Native (Expo) |
| **Nivedhitha** | Templates & Export | Jinja2, WeasyPrint, python-docx |

---

## Architecture

```
React Native (Expo) → Nginx (TLS 1.3) → FastAPI → PostgreSQL + Redis + Cloudflare R2
                                              ↓
                                    Whisper API + Claude API
```

---

## Project Structure

```
Voice-to-Report/
├── backend/        # FastAPI — Yashwanth
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/      # SQLAlchemy (User, Report)
│   │   ├── routers/     # auth, transcription, correction, suggestions, reports, templates, export
│   │   ├── services/    # whisper, claude, storage, export
│   │   └── schemas/     # Pydantic schemas
│   ├── requirements.txt
│   └── Dockerfile
│
├── mobile/         # React Native — Anirudh
│   ├── app/
│   │   ├── auth/        # login, pin screens
│   │   └── app/         # index (modality), dictate, results, editor, export, history
│   ├── components/      # ModalityCard, AudioWaveform, SuggestionPanel, ExportSheet
│   ├── store/           # Zustand: authStore, reportStore
│   └── services/        # api.ts (Axios)
│
├── templates/      # Jinja2 Templates — Nivedhitha
│   ├── standard/        # base, usg, ct, mri, xray .html.j2
│   ├── styles/          # letterhead.css
│   └── schema/          # report_schema.json
│
├── docker-compose.yml
├── nginx.conf
└── README.md
```

---

## Phase Status

| Phase | Duration | Status | Milestone |
|---|---|---|---|
| **Phase 1 — Foundation** | Weeks 1–2 | 🏗️ In Progress | Voice-to-corrected-text pipeline |
| **Phase 2 — Core Features** | Weeks 3–4 | ⏳ Pending | Full dictate → format → export |
| **Phase 3 — Polish & Delivery** | Week 5 | ⏳ Pending | App ready for pilot deployment |

---

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
# Fill in OPENAI_API_KEY, ANTHROPIC_API_KEY, DATABASE_URL, etc.

pip install -r requirements.txt
uvicorn app.main:app --reload
# API docs at http://localhost:8000/docs
```

### Mobile

```bash
cd mobile
npm install
npx expo start
# Scan QR code with Expo Go app
```

### Docker (Full Stack)

```bash
cp backend/.env.example backend/.env
# Fill in your API keys

docker compose up --build
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register radiologist |
| POST | `/api/v1/auth/login` | Login (email + password) |
| POST | `/api/v1/auth/pin/login` | Quick PIN login |
| POST | `/api/v1/transcribe` | Upload audio → Whisper transcription |
| POST | `/api/v1/correct` | Raw text → Claude accent correction |
| POST | `/api/v1/suggestions` | Corrected text → Claude AI suggestions |
| CRUD | `/api/v1/reports` | Report management |
| GET  | `/api/v1/templates` | List report templates |
| POST | `/api/v1/export` | Generate PDF / DOCX / TXT |

---

## Estimated Monthly Cost: ~$33

| Service | Cost |
|---|---|
| OpenAI Whisper (~500 min) | ~$3 |
| Claude API (~500 reports) | ~$10 |
| VPS (Docker + Uvicorn) | ~$20 |
| Cloudflare R2, Redis, DB, SSL | $0 |