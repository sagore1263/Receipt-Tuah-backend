from google import genai
from dotenv import load_dotenv
import os
import json
import str_format as sf
from PIL import Image
import base64
import io
load_dotenv()

global model
model = genai.Client(api_key=os.getenv("API_KEY"))

global chat
chat = model.aio.chats.create(model = "gemini-2.0-flash-thinking-exp-01-21")

def clear_chat():
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

    image = Image.open('image.png')

    response = model.models.generate_content(
        model="gemini-2.0-flash",
        contents=["What is this image?", image])
    return response.text
async def convert_image_to_text(path):
    global chat
    global model

    image = Image.open(path)

    response = model.models.generate_content(
        model="gemini-2.0-flash",
        contents=["Convert this to text", image])
    return response.text
dict_prompt = """Convert this receipt text into a dictionary. Use the following format - 
Date : (DD/MM/YYYY), Time : (HH:MM), Merchant : (merchant), Location : (location), Items : [{name : (ex : burger, onion, etc.), quantity : (int - optional), price : ($), Category : (see below), Sub-Category : (see below)}] , Total : (total), Tax : (tax), Other : {json}
If some of the fields are not available, just leave them blank. Put any field not listed in the "Other" field.
Just output the dictionary and nothing else.

List of categories and subcateogries:
Food: Groceries, Restaurants, Fast Food, Alcohol, Delivery, Other
Housing: Rent/Mortgage, Electricity, Internet, Other 
Transportation: Fuel, Public Transit, Taxi
Shopping: Clothing, Electronics, Furniture, Other
Entertainment: Streaming, Events, Video Games, Movies, Subscriptions
Financial: Income, Credit Card Payments
Personal Care: Haircuts, Skincare & Makeup, Hygiene Products, Spa & Massage
Miscellaneous: Uncategorized, Cash Withdrawal, Other
"""


async def receipt_to_dict(text):
    global chat
    global model

    response = model.models.generate_content(
        model="gemini-2.0-flash",
        contents=[dict_prompt, text])
    print(response.text)
    return response.text
async def ai_image_to_dict(image):
    global chat
    global model
    response = model.models.generate_content(
        model="gemini-2.0-flash",
        contents=["Convert this to text", image])
    result = await receipt_to_dict(response.text)
    result = sf.clean_and_parse_json_string(result)
    return json.loads(result)