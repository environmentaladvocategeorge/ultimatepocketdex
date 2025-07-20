from fastapi import APIRouter
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
    async def generate_embedding():
        try:
            session = db.get_session()
            logger.info("Mock embedding generation invoked.")
            return JSONResponse(content={"message": "Mock embedding generated successfully."}, status_code=200)
        except Exception as e:
            logger.error(f"Error in mock embedding generation: {str(e)}", exc_info=True)
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        finally:
            session.close()

    return router
