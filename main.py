from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import AI_API as ai
import str_format as sf
import json
from PIL import Image
import io
import base64
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()


origins = [
    "http://localhost:3000",   # React dev server
    "http://127.0.0.1:3000",   # Optional, just in case
    "http://localhost:8000",   # FastAPI dev server
    "http://localhost:3001",   # React dev server
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

global enable_search
enable_search = False

global id_user 
id_user= "67f21bb8b386c742b3e13a82"

@app.get("/")
def home_view():
    return "Hello world"

@app.get("/set-id")
def set_id_view(id: str):
    global id_user
    id_user = id
    return id_user

@app.get("/clear-chat")
def clear_chat_view(id: str):
    global id_user
    id_user = id
    ai.clear_chat()
    return "Chat cleared and id set to " + id_user

@app.get("/enable-search")
def enable_search_view():
    global enable_search
    enable_search = True
    return "Search enabled"

@app.get("/disable-search")
def disable_search_view():
    global enable_search
    enable_search = False
    return "Search disabled"

@app.get("/ai")
async def ai_speak(subject: str):
    return await ai.generate_response(subject, id_user, enable_search)

@app.get("/ai-old")
async def ai_view():
    return await ai.generate_response("Hi, what is your name?")
    
@app.get("/image")
async def ai_image():
    return await ai.generate_image_summary()

@app.get("/image-to-text")
async def ai_image_to_text(path: str):
    text = await ai.convert_image_to_text(path)
    result = await ai.receipt_to_dict(text)
    result = sf.clean_and_parse_json_string(response_text=result)
    return json.loads(result)
@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    # Do your image processing here
    receipt = await ai.ai_image_to_dict(image)
    encoded_image = base64.b64encode(contents).decode("utf-8")
    mime_type = Image.MIME.get(image.format, "image/png")  # fallback
    return {"receipt": receipt, "mimeType": mime_type}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)