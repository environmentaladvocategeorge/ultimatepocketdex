from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from alchemy_models.user import User
from repository.postgresql_database import PostgresDatabase
from services.cognito_service import CognitoService
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()
db = PostgresDatabase(
    host="ultimatepocketdex-dev-rds.chwiscumebq1.us-east-1.rds.amazonaws.com",
    database="upd-db",
    user="jorgelovesdata",
    password="Apple123Watch"
)
session = db.get_session()
cognito_service = CognitoService()

def create_user_controller():  
    @router.get("/user-profile")
    async def get_user_profile(user: User = Depends(cognito_service.extract_token)):
        try:
            logger.info(f"User {user.user_id} requested their own profile.")
            user_dict = user.to_dict()
            return JSONResponse(content=user_dict)
        except Exception as e:
            logger.error(f"Error retrieving user profile: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        
    return router
