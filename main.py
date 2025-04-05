from fastapi import FastAPI

import AI_API as ai

app = FastAPI()

@app.get("/")
def home_view():
    return "Hello world"

@app.get("/ai")
async def ai_speak(subject: str):
    return await ai.generate_response(subject)

@app.get("/ai-old")
async def ai_view():
    return await ai.generate_response("Hi, what is your name?")
    


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)