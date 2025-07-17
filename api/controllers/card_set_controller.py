from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy.orm import joinedload
from alchemy_models.card_set import CardSet
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

def create_card_set_controller():
    @router.get("/card-set")
    async def get_card_sets():
        session = None
        try:
            session = db.get_session()
            logger.info("Fetching CardSets grouped by CardSeries")

            all_sets = (
                session.query(CardSet)
                .options(joinedload(CardSet.series))
                .order_by(CardSet.series_id, CardSet.set_release_date)
                .all()
            )

            series_map = {}

            for card_set in all_sets:
                series_name = card_set.series.series_name if card_set.series else "Unknown Series"
                if series_name not in series_map:
                    series_map[series_name] = []
                series_map[series_name].append(card_set.to_dict())

            formatted_sections = [
                {
                    "series": series_name,
                    "data": sets
                }
                for series_name, sets in series_map.items()
            ]

            return JSONResponse(content=formatted_sections)

        except Exception as e:
            logger.error(f"Error fetching CardSets by series: {str(e)}", exc_info=True)
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})

        finally:
            if session:
                session.close()

    return router