from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from services.openclip_service import OpenCLIPService
from repository.postgresql_database import PostgresDatabase
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

db = PostgresDatabase(
    host="ultimatepocketdex-dev-rds.chwiscumebq1.us-east-1.rds.amazonaws.com",
    database="upd-db",
    user="jorgelovesdata",
    password="Apple123Watch"
)

open_clip_service = OpenCLIPService()

def create_embedding_controller():
    @router.post("/embedding")
    async def generate_embedding(image: UploadFile = File(...)):
        try:
            logger.info(f"Received image: {image.filename}")
            image_bytes = await image.read()

            if not image_bytes:
                return JSONResponse(status_code=400, content={"message": "Image file is empty"})

            result = open_clip_service.get_image_embedding(image_bytes)
            embedding_length = len(result) if result is not None else 0
            return JSONResponse(content={"embedding_length": embedding_length}, status_code=200)

        except Exception as e:
            logger.error(f"Error during embedding generation: {str(e)}", exc_info=True)
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})

    return router
