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
                .order_by(CardSet.set_release_date.desc())
                .all()
            )

            series_map = {}

            for card_set in all_sets:
                series_name = card_set.series.series_name if card_set.series else "Other"
                series_entry = series_map.setdefault(series_name, {"sets": [], "latest_date": None})

                series_entry["sets"].append(card_set.to_dict())

                if card_set.set_release_date:
                    if not series_entry["latest_date"] or card_set.set_release_date > series_entry["latest_date"]:
                        series_entry["latest_date"] = card_set.set_release_date

            sorted_series = sorted(
                (name for name in series_map if name != "Other"),
                key=lambda name: series_map[name]["latest_date"] or "",
                reverse=True
            )
            if "Other" in series_map:
                sorted_series.append("Other")

            formatted_sections = [
                {
                    "series": name,
                    "data": series_map[name]["sets"]
                }
                for name in sorted_series
            ]

            return JSONResponse(content=formatted_sections)

        except Exception as e:
            logger.error(f"Error fetching CardSets by series: {str(e)}", exc_info=True)
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})

        finally:
            if session:
                session.close()

    return router
