from operator import or_
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from sqlalchemy import desc
from sqlalchemy.orm import joinedload
from alchemy_models.card_price_history import CardPriceHistory
from repository.postgresql_database import PostgresDatabase
from alchemy_models.card import Card
from alchemy_models.card_set import CardSet
from utils.logger import get_logger
from sqlalchemy.orm import aliased

logger = get_logger(__name__)
router = APIRouter()

db = PostgresDatabase(
    host="ultimatepocketdex-dev-rds.chwiscumebq1.us-east-1.rds.amazonaws.com",
    database="upd-db",
    user="jorgelovesdata",
    password="Apple123Watch"
)

latest_price_alias = aliased(CardPriceHistory)

def create_search_controller():
    @router.get("/search")
    async def search(
        page: int = Query(1, ge=1, description="Page number, starting from 1"),
        pageSize: int = Query(20, ge=1, le=100, description="Number of items per page")
    ):
        try:
            session = db.get_session()
            logger.info(f"Fetching cards from database - Page: {page}, Page Size: {pageSize}")
            
            offset = (page - 1) * pageSize
            
            query = session.query(Card).options(
                joinedload(Card.card_set).joinedload(CardSet.series),
                joinedload(Card.latest_price)
            ).join(
                latest_price_alias, Card.latest_price_id == latest_price_alias.price_id, isouter=True
            ).order_by(desc(latest_price_alias.price))
            
            total_count = query.count()
            
            paginated_cards = query.offset(offset).limit(pageSize).all()
            
            cards_data = [card.to_dict() for card in paginated_cards]

            total_pages = (total_count + pageSize - 1) // pageSize
            has_next = page < total_pages
            has_prev = page > 1
            
            return JSONResponse(content={
                "cards": cards_data,
                "pagination": {
                    "page": page,
                    "pageSize": pageSize,
                    "totalCount": total_count,
                    "totalPages": total_pages,
                    "hasNext": has_next,
                    "hasPrev": has_prev
                }
            })
            
        except Exception as e:
            logger.error(f"Error fetching cards: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        finally:
            session.close()
    
    return router