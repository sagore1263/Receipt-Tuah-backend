from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import AI_API as ai

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
    return await ai.convert_image_to_text(path)

@app.get("/clear")
async def ai_clear():
    return ai.clear_chat()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)