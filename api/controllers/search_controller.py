from operator import or_
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from sqlalchemy import desc, asc
from sqlalchemy.orm import joinedload
from alchemy_models.card_price_history import CardPriceHistory
from repository.postgresql_database import PostgresDatabase
from alchemy_models.card import Card
from alchemy_models.card_set import CardSet
from utils.logger import get_logger
from sqlalchemy.orm import aliased
from pydantic import BaseModel
from enum import Enum

logger = get_logger(__name__)
router = APIRouter()

db = PostgresDatabase(
    host="ultimatepocketdex-dev-rds.chwiscumebq1.us-east-1.rds.amazonaws.com",
    database="upd-db",
    user="jorgelovesdata",
    password="Apple123Watch"
)

latest_price_alias = aliased(CardPriceHistory)

class SortBy(str, Enum):
    PRICE_ASC = "price_asc"
    PRICE_DESC = "price_desc"
    NAME_ASC = "name_asc"
    NAME_DESC = "name_desc"

class SearchParams(BaseModel):
    page: int = 1
    pageSize: int = 20
    sortBy: SortBy = SortBy.PRICE_DESC

def create_search_controller():
    @router.get("/search")
    async def search(
        page: int = Query(1, ge=1, description="Page number, starting from 1"),
        pageSize: int = Query(20, ge=1, le=100, description="Number of items per page"),
        sortBy: SortBy = Query(SortBy.PRICE_DESC, description="Sort criteria")
    ):
        try:
            session = db.get_session()
            logger.info(f"Fetching cards from database - Page: {page}, Page Size: {pageSize}, Sort: {sortBy}")
            
            offset = (page - 1) * pageSize
            
            query = session.query(Card).options(
                joinedload(Card.card_set).joinedload(CardSet.series),
                joinedload(Card.latest_price)
            ).join(
                latest_price_alias, Card.latest_price_id == latest_price_alias.price_id, isouter=True
            )
            
            if sortBy == SortBy.PRICE_ASC:
                query = query.order_by(asc(latest_price_alias.price))
            elif sortBy == SortBy.PRICE_DESC:
                query = query.order_by(desc(latest_price_alias.price))
            elif sortBy == SortBy.NAME_ASC:
                query = query.order_by(asc(Card.card_name))
            elif sortBy == SortBy.NAME_DESC:
                query = query.order_by(desc(Card.card_name))
            
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
                },
                "sortBy": sortBy
            })
            
        except Exception as e:
            logger.error(f"Error fetching cards: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        finally:
            session.close()
    
    return router