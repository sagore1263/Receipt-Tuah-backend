import requests
import mongo_API_calls as mAPI
import asyncio
import json

# Replace with your actual server URL and port
url = "http://127.0.0.1:8000/upload-image/"

categories = [
    "Food",
    "Housing",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Personal Care",
    "Miscellaneous"
]
async def stuff():
    for category in categories:
        print(f"Category: {category}")
        items = await mAPI.get_category_items("d", category)
        for item in items['items']:
            print(f"Item: {item['name']}, Price: {item['price']}, subCategory: {item['subcategory']['name']}")
        else:
            print("No items found.")
    exit()
asyncio.run(stuff())
# Path to your test image
image_path = "receipts/lepeep.jpg"

with open(image_path, "rb") as img_file:
    files = {"file": ("receipt.jpg", img_file, "image/jpeg")}
    response = requests.post(url, files=files)

print("Status code:", response.status_code)
print("Response JSON:", response.json()['receipt'])