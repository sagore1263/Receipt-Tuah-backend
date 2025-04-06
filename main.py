from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import AI_API as ai
import str_format as sf
import json
from PIL import Image
import io
import base64
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

global enable_search
enable_search = False 

@app.get("/")
def home_view():
    return "Hello world"

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
    return await ai.generate_response(subject, enable_search)

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
    return {"receipt": receipt, "imageBytes": encoded_image, "imageSize": image.size, "imageMode": image.mode}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)