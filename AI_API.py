from google import genai

global model
model = genai.Client(api_key="AIzaSyAItJFii-704bJ6YfZb6GfZ-gVfmu117bo")

global chat
chat = client.aio.chats.create(model = "gemini-2.5-pro-exp-03-25")

async def generate_response(prompt):
    global chat
    global model

    response = await chat.send_message(prompt)
    return response.text