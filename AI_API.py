from google import genai
from dotenv import load_dotenv
import os
import json
import str_format as sf
from PIL import Image
from google.genai import types

from google.genai.types import Tool, GenerateContentConfig, GoogleSearch

load_dotenv()

global model
model = genai.Client(api_key=os.getenv("API_KEY"))

global chat
chat = model.aio.chats.create(model = "gemini-2.5-pro-exp-03-25")

global google_search_tool
google_search_tool = Tool(
    google_search = GoogleSearch()
)

def clear_chat():
    global chat
    chat = model.aio.chats.create(model = "gemini-2.5-pro-exp-03-25")

async def generate_response(prompt, enable_search = False):
    global chat
    global model

    if enable_search:
        response = await chat.send_message(prompt, 
            config=types.GenerateContentConfig(
            tools=[types.Tool(
                google_search=types.GoogleSearchRetrieval
            )])
        )
    else:
        response = await chat.send_message(prompt)
    return response.text

async def generate_image_summary():
    global chat
    global model

    image = Image.open('image.png')

    response = model.models.generate_content(
        model="gemini-2.0-flash-thinking-exp-01-21",
        contents=["What is this image?", image])
    return response.text
async def convert_image_to_text(path):
    global chat
    global model

    image = Image.open(path)

    response = model.models.generate_content(
        model="gemini-2.0-flash-thinking-exp-01-21",
        contents=["Convert this to text", image])
    return response.text
dict_prompt = """Convert this receipt text into a dictionary. Use the following format - 
Date : (DD/MM/YYYY), Time : (time), Merchant : (merchant), Location : (location), Items : [{name : (ex : burger, onion, etc.), quantity : (quantity), price : (price)}], Category :(ex : food, entertainment, home, etc.), Subcategory : (ex : lunch, dinner, furniture, etc.), Total : (total), Tax : (tax), Other : {json}
If some of the fields are not available, just leave them blank. Put any field not listed in the "Other" field.
Just output the dictionary and nothing else."""
async def receipt_to_dict(text):
    global chat
    global model

    response = model.models.generate_content(
        model="gemini-2.0-flash",
        contents=[dict_prompt, text])
    return response.text
async def ai_image_to_dict(image):
    global chat
    global model
    response = model.models.generate_content(
        model="gemini-2.0-flash-thinking-exp-01-21",
        contents=["Convert this to text", image])
    result = await receipt_to_dict(response.text)
    result = sf.clean_and_parse_json_string(result)
    return json.loads(result)