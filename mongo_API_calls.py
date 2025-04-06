import aiohttp
import asyncio
import os
from dotenv import load_dotenv
load_dotenv()
DB_PORT = os.getenv("MONGO_PORT")
DB_HOST = f"http://localhost:{DB_PORT}"


async def get_context_from_db(id_user):
    if not id_user or id_user == "":
        return "Not in the NONE"
    
    # Remove any quotes that might be in the ID
    id_user = id_user.replace('"', '')
    
    async with aiohttp.ClientSession() as session:
        url = f"{DB_HOST}/userdata?id={id_user}"
        print(f"Making request to: {url}")
        
        async with session.get(url) as response:
            if response.status == 200:
                return await response.json()
            else:
                error_text = await response.text()
                print(f"Server error {response.status}: {error_text[:100]}...")
                return f"Error retrieving data (Status: {response.status})"

async def get_receipt_img(receipt_id):
    pass