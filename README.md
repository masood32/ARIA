# ARIA - AI Real-time Intelligence Assistant

ARIA is a real-time AI assistant that watches your screen and listens to your microphone, providing live voice-based guidance powered by Google Gemini's Live API. It acts like a knowledgeable colleague looking over your shoulder — proactively helping you during meetings, technical work, learning sessions, and interviews.

## Features

- **Real-time screen analysis** — captures your screen at ~1 fps and sends frames to Gemini for continuous visual context
- **Live voice conversation** — bidirectional audio via microphone input and AI-generated speech output
- **Text chat** — type messages directly to ARIA alongside voice
- **Speech transcription** — both your speech and ARIA's responses are transcribed and shown in the conversation panel
- **Three assistant modes:**
  - **Learning** — guides you through tools like AWS, Azure, Power BI, Terraform, Docker, Kubernetes step by step
  - **Meeting** — provides real-time context and talking points during video calls or presentations
  - **Interview** — quietly suggests key points, frameworks, and answer structure during interviews
- **Code review** — spots bugs, security issues, and improvements in code visible on screen

## Architecture

```
live meeting system/
├── backend/                  # Python FastAPI server
│   ├── main.py               # WebSocket server + Gemini Live API integration
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment variable template
└── frontend/                 # Next.js application
    ├── app/
    │   ├── page.tsx           # Main application page
    │   └── layout.tsx         # Root layout
    ├── components/
    │   ├── Header.tsx         # Mode selector + connection status
    │   ├── ConversationPanel.tsx  # Chat UI with message bubbles
    │   ├── ScreenPreview.tsx  # Live screen share preview
    │   └── ControlBar.tsx     # Connect/mic/speaker/screen controls
    ├── hooks/
    │   ├── useGeminiSession.ts    # WebSocket session management
    │   ├── useScreenCapture.ts    # Screen capture + frame extraction
    │   ├── useAudioProcessor.ts   # Mic capture + audio playback
    │   └── useSpeechRecognition.ts # Browser speech-to-text
    └── public/
        └── audio-worklet.js   # AudioWorklet processor for low-latency mic capture
```

### How it works

1. The **frontend** connects to the backend via WebSocket (`ws://localhost:8000/ws`)
2. Screen frames are captured at 2 fps, scaled to max 1280px wide, encoded as JPEG, and sent as base64
3. Microphone audio is captured via an AudioWorklet, buffered into 256ms chunks (PCM at 16kHz), and sent as base64
4. The **backend** proxies all data to the **Gemini Live API** in real time
5. Gemini responds with audio (PCM) and text transcripts, which are forwarded back to the frontend
6. The frontend decodes and plays back the audio, and displays transcripts in the conversation panel

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, WebSockets |
| AI | Google Gemini Live API (`gemini-2.5-flash-native-audio-preview-12-2025`) |
| Audio | Web Audio API, AudioWorklet |
| Screen capture | `getDisplayMedia` browser API |

## Prerequisites

- Python 3.11+ (uses `asyncio.TaskGroup`, requires 3.11+)
- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com/) API key with access to the Gemini Live API

## Setup & Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd "live meeting system"
```

### 2. Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Edit `.env` and set your API key:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash-native-audio-preview-12-2025
```

Start the backend:

```bash
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at `http://localhost:8000`.

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Usage

1. Open `http://localhost:3000` in your browser
2. Select a mode: **Learning**, **Meeting**, or **Interview**
3. Click **Connect** to establish a session with ARIA — she will greet you
4. Optionally click **Share Screen** to let ARIA see your screen
5. Optionally click the **Mic** button to enable voice conversation
6. ARIA will proactively comment on what she sees and answer your questions
7. You can also type messages in the conversation panel at any time

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Required |
| `GEMINI_MODEL` | Gemini model ID to use | `gemini-2.5-flash-native-audio-preview-12-2025` |

### Supported models

The following Gemini models support the Live API with audio and video input:

- `gemini-2.5-flash-native-audio-preview-12-2025` (recommended)
- `gemini-2.0-flash-live-001`

## API Reference

### WebSocket endpoint

**`ws://localhost:8000/ws`**

#### Messages sent from client to server

| Type | Payload | Description |
|------|---------|-------------|
| `audio` | `{ type: "audio", data: "<base64 PCM>" }` | Microphone audio chunk |
| `screen` | `{ type: "screen", data: "<base64 JPEG>" }` | Screen frame |
| `text` | `{ type: "text", content: "..." }` | Text message |

#### Messages sent from server to client

| Type | Payload | Description |
|------|---------|-------------|
| `status` | `{ type: "status", message: "...", connected: bool }` | Connection status |
| `audio` | `{ type: "audio", data: "<base64 PCM>" }` | ARIA's voice response |
| `transcript` | `{ type: "transcript", role: "user"\|"assistant", content: "..." }` | Speech transcription |
| `error` | `{ type: "error", message: "..." }` | Error notification |

## Development Notes

- CORS is configured to allow `http://localhost:3000` only. Update `allow_origins` in `main.py` for production deployments.
- Screen frames are capped at 2 fps and 1280px width to keep WebSocket payload size manageable.
- Audio is buffered in 4096-sample chunks (~256ms at 16kHz) before sending to reduce WebSocket message frequency.
- The AudioWorklet runs in a dedicated audio thread for low-latency, glitch-free capture.
