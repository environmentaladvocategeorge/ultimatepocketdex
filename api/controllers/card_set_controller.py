from operator import and_, or_
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import joinedload
from repository.postgresql_database import PostgresDatabase
from alchemy_models.card import Card
from alchemy_models.card_set import CardSet
from alchemy_models.card_series import CardSeries
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
    async def get_all_sets(searchTerm: str = Query(None)):
        try:
            session = db.get_session()
            logger.info("Fetching all Pokémon TCG sets from the database...")
            query = session.query(CardSet).join(CardSet.series).options(joinedload(CardSet.series)).order_by(CardSet.set_release_date.desc())

            if searchTerm:
                words = searchTerm.split()
                filters = []
                for word in words:
                    pattern = f"%{word}%"
                    filters.append(
                        or_(
                            CardSet.set_name.ilike(pattern),
                            CardSeries.series_name.ilike(pattern)
                        )
                    )
                query = query.filter(and_(*filters))

            grouped_sets = defaultdict(list)
            for card_set in query.all():
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

    @router.get("/card-set/{set_id}")
    async def get_card_set_by_id(set_id: str):
        session = db.get_session()
        try:
            card_set = (
                session.query(CardSet)
                .options(
                    joinedload(CardSet.cards).joinedload(Card.latest_price)
                )
                .filter(CardSet.card_set_id == set_id)
                .first()
            )

            if not card_set:
                return JSONResponse(status_code=404, content={"message": "Card set not found"})

            return JSONResponse(content=card_set.to_dict())
        
        except Exception as e:
            logger.error(f"Error fetching card set by ID {set_id}: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        
        finally:
            session.close()
    return router