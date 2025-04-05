from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home_view():
    return "Hello world"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)