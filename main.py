from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import AI_API as ai
import str_format as sf
import json
from PIL import Image
import io
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home_view():
    return "Hello world"

@app.get("/ai")
async def ai_speak(subject: str):
    return await ai.generate_response(subject)

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
    result = sf.clean_and_parse_json_string(result)
    return json.loads(result)
@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    # Do your image processing here
    return await ai.ai_image_to_dict(image)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)