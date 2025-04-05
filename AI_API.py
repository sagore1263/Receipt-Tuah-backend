from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

global model
model = genai.Client(api_key=os.getenv("API_KEY"))

global chat
chat = model.aio.chats.create(model = "gemini-2.5-pro-exp-03-25")

async def generate_response(prompt):
    global chat
    global model

    response = await chat.send_message(prompt)
    return response.text