from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy.orm import joinedload
from repository.postgresql_database import PostgresDatabase
from alchemy_models.card_set import CardSet
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

db = PostgresDatabase(
    host="ultimatepocketdex-dev-rds.chwiscumebq1.us-east-1.rds.amazonaws.com",
    database="upd-db",
    user="jorgelovesdata",
    password="Apple123Watch"
)

def create_card_sets_controller():
    @router.get("/card-sets")
    async def get_all_sets():
        try:
            session = db.get_session()
            logger.info("Fetching all Pokémon TCG sets from the database...")
            sets = (
                session.query(CardSet)
                .options(joinedload(CardSet.series))
                .all()
            )
            sets_dict = [s.to_dict() for s in sets]
            return JSONResponse(content={"sets": sets_dict})
        except Exception as e:
            logger.error(f"Error fetching sets: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        finally:
            session.close()
    return router
