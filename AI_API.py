from google import genai
from dotenv import load_dotenv
import os
import json
import str_format as sf
from PIL import Image
from google.genai import types
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
from mongo_API_calls import get_context_from_db


load_dotenv()
MONGO_PORT = os.getenv("MONGO_PORT")
global has_context
has_context = False
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
    global has_context
    has_context = False

async def get_screen_context(page_view):
        global chat
        global model
        global has_context
        return
        # if page_view:
        #     prompt = f"""The screen currently displays the information to the user: {page_view}."""
        #     await chat.send_message(prompt)
        #     has_context = True
        # else:
        #     return "No context found for this user."

def remove__id_from_dict(db_context):
    if isinstance(db_context, dict):
        # Create a deep copy to avoid modifying the original
        clean_context = db_context.copy()
        
        # Remove _id from data object if it exists
        if 'data' in clean_context and isinstance(clean_context['data'], dict) and '_id' in clean_context['data']:
            del clean_context['data']['_id']
            
        formatted_context = json.dumps(clean_context, indent=2)
    elif isinstance(db_context, list):
        # For lists, create a version without _id fields
        clean_context = [{k: v for k, v in item.items() if k != '_id'} for item in db_context]
        formatted_context = json.dumps(clean_context, indent=2)
    else:
        formatted_context = db_context
    
    return formatted_context

async def set_user_context(id_user):
        global chat
        global model
        global has_context
        if (not id_user) :
            return "Error"
        db_context = await get_context_from_db(id_user)

        if db_context:
            
            formatted_context = remove__id_from_dict(db_context)

            prompt = f"""You are a helpful assistant helping a user with their finances.
                You have access to the following purchase data from the user:
                {formatted_context}

                Please respond to the following prompts based on this context information."""
            await chat.send_message(prompt)
            has_context = True
        else:
            return "No context found for this user."
async def generate_response(prompt, id_user, enable_search = False):
    global chat
    global model
    if (not has_context and id_user) :
        print(await set_user_context(id_user))
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
Date : (DD/MM/YYYY), Time : (HH:MM), Merchant : (merchant), Location : (location), Items : [{name : (ex : burger, onion, etc.), quantity : (int - optional), price : ($), Category : (see below), SubCategory : (see below)}] , Total : (total), Tax : (tax), Other : {json}
If some of the fields are not available, just leave them blank. Put any field not listed in the "Other" field. If there are no items create an item with the same name as the merchant and add price and category.
For Item names, do not be too specific because I want to group them together. For example red onions and sweet onions should be onions. Just output the dictionary and nothing else. 

List of categories and subcateogries:
Food: Groceries, Restaurants, Fast Food, Alcohol, Delivery
Housing: Rent/Mortgage, Electricity, Internet
Transportation: Fuel, Public Transit, Taxi
Shopping: Clothing, Electronics, Furniture, Other
Entertainment: Streaming, Events, Video Games, Movies, Subscriptions
Personal Care: Haircuts, Skincare & Makeup, Hygiene Products, Spa & Massage
Miscellaneous: Uncategorized, Cash Withdrawal
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
        model="gemini-2.0-flash-thinking-exp-01-21",
        contents=["Convert this to text", image])
    result = await receipt_to_dict(response.text)
    result = sf.clean_and_parse_json_string(result)
    return json.loads(result)