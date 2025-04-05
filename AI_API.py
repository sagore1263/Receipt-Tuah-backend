from google import genai
from dotenv import load_dotenv
import os

import PIL.Image

load_dotenv()

global model
model = genai.Client(api_key=os.getenv("API_KEY"))

global chat
chat = model.aio.chats.create(model = "gemini-2.0-flash-thinking-exp-01-21")

async def generate_response(prompt):
    global chat
    global model

    response = await chat.send_message(prompt)
    return response.text

async def generate_image_summary():
    global chat
    global model

    image = PIL.Image.open('image.png')

    response = model.models.generate_content(
        model="gemini-2.0-flash",
        contents=["What is this image?", image])
    return response.text
async def convert_image_to_text(path):
    global chat
    global model

    image = PIL.Image.open(path)

    response = model.models.generate_content(
        model="gemini-2.0-flash",
        contents=["Convert this to text", image])
    return response.text