import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("API_KEY"))

model = genai.GenerativeModel("gemini-pro")
print("yoohoo")
print("✅ API Key being used:", os.getenv("API_KEY"))
key = os.getenv("API_KEY").strip()
response = model.generate_content("Say hi 👋")
print(response.text)
