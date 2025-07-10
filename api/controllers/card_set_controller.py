from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy.orm import joinedload
from repository.postgresql_database import PostgresDatabase
from alchemy_models.card import Card
from alchemy_models.card_set import CardSet
from utils.logger import get_logger
from collections import defaultdict

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
    async def get_all_sets():
        try:
            session = db.get_session()
            logger.info("Fetching all Pokémon TCG sets from the database...")
            sets = (
                session.query(CardSet)
                .options(joinedload(CardSet.series))
                .order_by(CardSet.set_release_date.desc())
                .all()
            )
            
            grouped_sets = defaultdict(list)
            for card_set in sets:
                series_id = card_set.series_id
                series_name = card_set.series.series_name if card_set.series else "Unknown Series"
                grouped_sets[series_id].append(card_set.to_dict())
            
            sections = []
            for series_id, sets_list in grouped_sets.items():
                series_name = sets_list[0].get('series_name', 'Unknown Series')
                sections.append({
                    "id": str(series_id),
                    "title": series_name,
                    "data": sets_list
                })
            
            return JSONResponse(content={"sets": sections})
        except Exception as e:
            logger.error(f"Error fetching sets: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        finally:
            session.close()

    @router.get("/card-set/{set_id}/card")
    async def get_all_cards_for_set(set_id: str):
        try:
            session = db.get_session()
            cards = session.query(Card).filter(Card.card_set_id == set_id).all()

            if not cards:
                return JSONResponse(status_code=404, content={"message": "No cards found for this set"})
            
            card_list = [card.to_dict() for card in cards]
            return JSONResponse(content={"cards": card_list})   
        except Exception as e:
            logger.error(f"Error fetching set by ID {set_id}: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        finally:
            session.close()
    return router