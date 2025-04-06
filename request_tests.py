import requests

# Replace with your actual server URL and port
url = "http://127.0.0.1:8000/upload-image/"

# Path to your test image
image_path = "receipt.jpg"

with open(image_path, "rb") as img_file:
    files = {"file": ("receipt.jpg", img_file, "image/jpeg")}
    response = requests.post(url, files=files)

print("Status code:", response.status_code)
print("Response JSON:", response.json()['receipt'])