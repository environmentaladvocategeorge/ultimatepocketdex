from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from controllers.card_set_controller import create_card_set_controller
from controllers.pokemon_controller import create_pokemon_controller
from controllers.user_controller import create_user_controller
from controllers.search_controller import create_search_controller
from utils.logger import get_logger

logger = get_logger(__name__)
app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://d183tv4ydm58ad.cloudfront.net"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again later.")

app.include_router(create_user_controller())
app.include_router(create_card_set_controller())
app.include_router(create_search_controller())
app.include_router(create_pokemon_controller())

handler = Mangum(app)
