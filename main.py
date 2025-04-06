from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import AI_API as ai
import str_format as sf
import json
from PIL import Image
import io
import base64
from dotenv import load_dotenv
import mongo_API_calls as mAPI
load_dotenv()
app = FastAPI()


origins = [
    "http://localhost:3000",   # React dev server
    "http://127.0.0.1:3000",   # Optional, just in case
    "http://localhost:8000",   # FastAPI dev server
    "http://localhost:3001",   # React dev server
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

global enable_search
enable_search = False

global id_user 
id_user= None

@app.get("/")
def home_view():
    return "Hello world"

@app.get("/set-id")
def set_id_view(id: str):
    global id_user
    id_user = id
    ai.clear_chat()
    ai.set_user_context(id_user)
    return id_user

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
    return await ai.generate_response(subject, id_user, enable_search)

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
@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    # Do your image processing here
    receipt = await ai.ai_image_to_dict(image)
    encoded_image = base64.b64encode(contents).decode("utf-8")
    mime_type = Image.MIME.get(image.format, "image/png")  # fallback
    return {"receipt": receipt, "imageBytes" : encoded_image, "mimeType": mime_type}
@app.get("/receipt-image")
async def get_receipt_img(id : str):
    if not id or id == "":
        raise HTTPException(status_code=400, detail="Invalid Receipt ID")
    receipt = await mAPI.get_receipt(id)
    if not receipt:
        raise HTTPException(status_code=404, detail="No receipt found")
    return {"image": receipt['data'], "mime_type": receipt['mime_type']}
categories = [
    "Food",
    "Housing",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Personal Care",
    "Miscellaneous"
]
@app.get("/category-pie-chart")
async def get_category_pie_chart(id: str):
    if not id or id == "":
        raise HTTPException(status_code=400, detail="Invalid User ID")
    data = {}
    for category in categories:
        items = await mAPI.get_category_items(id, category)
        if items['total'] > 0:
            data[category] = items['total']
    
    get_screen_view(data)

    return data
subcategories = {
    "Food": ["Groceries", "Restaurants", "Fast Food", "Alcohol", "Delivery"],
    "Housing": ["Rent/Mortgage", "Electricity", "Internet"],
    "Transportation": ["Fuel", "Public Transit", "Taxi"],
    "Shopping": ["Clothing", "Electronics", "Furniture", "Other"],
    "Entertainment": ["Streaming", "Events", "Video Games", "Movies", "Subscriptions"],
    "Personal Care": ["Haircuts", "Skincare & Makeup", "Hygiene Products", "Spa & Massage"],
    "Miscellaneous": ["Uncategorized", "Cash Withdrawal"]
}
@app.get("/subcategory-pie-chart")
async def get_subcategory_pie_chart(id: str, category: str):
    if not id or id == "":
        raise HTTPException(status_code=400, detail="Invalid User ID")
    if category not in categories:
        raise HTTPException(status_code=400, detail="Invalid Category")
    data = {}
    for subcategory in subcategories[category]:
        items_str = await mAPI.get_subcategory_items(id, subcategory)
        print(items_str)
        items = json.loads(items_str) if isinstance(items_str, str) else items_str
        if items['total'] > 0:
            data[subcategory] = items['total']
    
    get_screen_view(data)
    return data
    
@app.get("/update-context")
async def update_context(id: str):
    if not id or id == "":
        return None
    ai.set_user_context(id_user)

@app.get("/get-page-value")
async def page_view(cat: str, date: str):
    data_str = await mAPI.recent_categories(id_user, cat, date)

    print(data_str)
    data = json.loads(data_str) if isinstance(data_str, str) else data_str

    prices_graph = []
    for item in data["items"]:
        prices_graph.append({"price": item["price"]})

    counts = {{}}
    item_names = set()
    for item in data["items"]:
        counts[item["name"]] = {"price": counts.get(item["name"], 0) + item["price"], "quantity": counts.get(item["name"], 0) + item["quantity"]}
        item_names.add(item["name"])

    get_screen_view({"list": data["items"], 
            "total": data["total"], 
            "average": data["average"], 
            "prices_graph": prices_graph,
            "statistics": counts})

    return {"list": data["items"], 
            "total": data["total"], 
            "average": data["average"], 
            "prices_graph": prices_graph,
            "item_names": list(item_names),
            "statistics": counts}
@app.get("/get-recent-receipts")
async def get_recent_receipts(days: int):
    if not id_user or id_user == "":
        return "Invalid User ID"
    data = await mAPI.get_recent_receipts(id_user)
    if not data:
        return None
    receipts = []
    for receipt in data['purchases']:
        receipts.append([receipt['date'], receipt['merchant'], receipt['total'], receipt['id']])
@app.get("/screen-context")
async def get_screen_view(thing):
    return await ai.get_screen_context(thing)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)