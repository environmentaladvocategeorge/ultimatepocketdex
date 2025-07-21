from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
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

def create_embedding_controller():
    @router.post("/embedding")
    async def generate_embedding(image: UploadFile = File(...)):
        session = None
        try:
            session = db.get_session()

            logger.info("Mock embedding generation invoked.")
            logger.info(f"Received image: filename={image.filename}, content_type={image.content_type}")

            image_content = await image.read()
            if not image_content:
                logger.warning("No image content received.")
                return JSONResponse(status_code=400, content={"message": "Empty image file received"})

            return JSONResponse(
                content={
                    "message": "Mock embedding generated successfully.",
                    "filename": image.filename,
                    "content_type": image.content_type,
                    "size_bytes": len(image_content)
                },
                status_code=200
            )
        except Exception as e:
            logger.error(f"Error in mock embedding generation: {str(e)}", exc_info=True)
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        finally:
            if session:
                session.close()

    return router
