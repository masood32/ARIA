import asyncio
import base64
import json
import os

from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-live-001")

SYSTEM_INSTRUCTIONS = {
    "learning": """You are ARIA, a voice assistant and proactive learning guide.
CRITICAL: Speak naturally. Never use markdown, asterisks, bullet points, headers, or formatting of any kind. Just speak plain words as if talking to someone.
Never narrate what you are doing or thinking. Just say your answer directly.
Your job: Walk users through tools step by step as you see them on screen.
When you see AWS, Azure, Power BI, Terraform, Docker, Kubernetes — proactively say what to do next.
When you see code — call out bugs or improvements by line number.
Be short and direct. One or two sentences at a time.""",

    "meeting": """You are ARIA, a voice assistant for meetings.
CRITICAL: Speak naturally. Never use markdown, asterisks, bullet points, headers, or formatting of any kind. Just speak plain words as if talking to someone.
Never narrate what you are doing or thinking. Just say your answer directly.
Your job: Help the user in real-time during meetings. Suggest talking points, summarize what was said, help them respond.
Be brief. One or two sentences at a time.""",

    "interview": """You are ARIA, a voice interview coach.
CRITICAL: Speak naturally. Never use markdown, asterisks, bullet points, headers, or formatting of any kind. Just speak plain words as if talking to someone.
Never narrate what you are doing or thinking. Just say your answer directly.
Your job: Give quick coaching hints during interviews. Suggest STAR format, remind key points to mention.
Be very short — one sentence, like a whisper.""",
}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, mode: str = Query("learning")):
    await websocket.accept()
    print(f"Client connected (mode={mode})")

    system_instruction = SYSTEM_INSTRUCTIONS.get(mode, SYSTEM_INSTRUCTIONS["learning"])
    config = {
        "response_modalities": ["AUDIO"],
        "input_audio_transcription": {},
        "output_audio_transcription": {},
        "system_instruction": system_instruction,
    }

    try:
        async with client.aio.live.connect(model=MODEL, config=config) as session:
            await websocket.send_json({
                "type": "status",
                "message": "Connected to Gemini Live API",
                "connected": True
            })

            async def receive_from_client():
                """Forward client messages to Gemini."""
                while True:
                    try:
                        raw = await websocket.receive_text()
                        data = json.loads(raw)
                        msg_type = data.get("type")

                        if msg_type == "audio":
                            audio_bytes = base64.b64decode(data["data"])
                            await session.send_realtime_input(
                                audio={"data": audio_bytes, "mime_type": "audio/pcm"}
                            )

                        elif msg_type == "screen":
                            image_bytes = base64.b64decode(data["data"])
                            await session.send_realtime_input(
                                video={"data": image_bytes, "mime_type": "image/jpeg"}
                            )

                        elif msg_type == "text":
                            content = data.get("content", "")
                            if content:
                                await session.send_realtime_input(text=content)

                    except WebSocketDisconnect:
                        break
                    except Exception as e:
                        print(f"Error in receive_from_client: {e}")
                        break

            async def send_to_client():
                """Forward Gemini responses to client."""
                while True:
                    try:
                        turn = session.receive()
                        async for response in turn:
                            if not response.server_content:
                                continue

                            sc = response.server_content

                            # Model audio response
                            if sc.model_turn:
                                for part in sc.model_turn.parts:
                                    if part.inline_data and isinstance(part.inline_data.data, bytes):
                                        audio_b64 = base64.b64encode(part.inline_data.data).decode()
                                        await websocket.send_json({
                                            "type": "audio",
                                            "data": audio_b64
                                        })
                                    if part.text:
                                        print(f"DEBUG model_turn text: {repr(part.text[:100])}")

                            # User speech transcription
                            if hasattr(sc, "input_transcription") and sc.input_transcription:
                                text = getattr(sc.input_transcription, "text", sc.input_transcription)
                                print(f"DEBUG input_transcription: {repr(str(text)[:100])}")
                                if text:
                                    await websocket.send_json({
                                        "type": "transcript",
                                        "role": "user",
                                        "content": str(text)
                                    })

                            # ARIA speech transcription
                            if hasattr(sc, "output_transcription") and sc.output_transcription:
                                text = getattr(sc.output_transcription, "text", sc.output_transcription)
                                print(f"DEBUG output_transcription: {repr(str(text)[:100])}")
                                if text:
                                    await websocket.send_json({
                                        "type": "transcript",
                                        "role": "assistant",
                                        "content": str(text)
                                    })

                    except Exception as e:
                        print(f"Error in send_to_client: {e}")
                        break

            async def send_greeting():
                """Send greeting after a short delay so send_to_client is ready."""
                await asyncio.sleep(0.8)
                await session.send_client_content(
                    turns=types.Content(
                        role="user",
                        parts=[types.Part(text=(
                            "Greet the user. Say: Hey, I am ARIA your real-time AI assistant. "
                            "How can I help you today? You can share your screen, "
                            "turn on your mic, or just ask me anything to get started."
                        ))]
                    ),
                    turn_complete=True
                )

            async with asyncio.TaskGroup() as tg:
                tg.create_task(receive_from_client())
                tg.create_task(send_to_client())
                tg.create_task(send_greeting())

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Session error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
