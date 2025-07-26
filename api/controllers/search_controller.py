from typing import Optional
from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy import desc, asc, func
from sqlalchemy.orm import joinedload, aliased
from sqlalchemy.sql import or_
from alchemy_models.card_price_history import CardPriceHistory
from alchemy_models.card_series import CardSeries
from services.sagemaker_service import SageMakerService
from services.pinecone_service import PineconeService
from repository.postgresql_database import PostgresDatabase
from alchemy_models.card import Card
from alchemy_models.card_set import CardSet
from utils.logger import get_logger
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

sagemaker_service = SageMakerService()
pinecone_service = PineconeService(
    index_name="upd-card-embeddings",
    api_key_path="upd/dev/pinecone-api-key"
)
pinecone_service.verify() 

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
    pokemonName: Optional[str] = None

def create_search_controller():
    @router.get("/search")
    async def search(
        page: int = Query(1, ge=1, description="Page number, starting from 1"),
        pageSize: int = Query(20, ge=1, le=100, description="Number of items per page"),
        sortBy: SortBy = Query(SortBy.PRICE_DESC, description="Sort criteria"),
        pokemonName: Optional[str] = Query(None, description="Name of the Pokémon to search for (partial match)"),
        setName: Optional[str] = Query(None, description="Name of the card set to filter by (partial match)"),
        q: Optional[str] = Query(None, description="Search query across card name, number, set, and series")
    ):
        session = None
        try:
            session = db.get_session()
            logger.info(f"Fetching cards - Page: {page}, Page Size: {pageSize}, Sort: {sortBy}, Pokémon: {pokemonName}, Set: {setName}, Query: {q}")

            offset = (page - 1) * pageSize

            query = session.query(Card).options(
                joinedload(Card.card_set).joinedload(CardSet.series),
                joinedload(Card.latest_price)
            ).join(
                CardSet, Card.card_set_id == CardSet.card_set_id
            ).join(
                CardSeries, CardSet.series_id == CardSeries.series_id
            ).outerjoin(
                latest_price_alias, Card.latest_price_id == latest_price_alias.price_id
            )

            if pokemonName:
                query = query.filter(Card.card_name.ilike(f"%{pokemonName}%"))

            if setName:
                query = query.filter(CardSet.set_name.ilike(f"%{setName}%"))

            if q:
                search_term = f"%{q.strip()}%"
                query = query.filter(
                    or_(
                        Card.card_name.ilike(search_term),
                        Card.card_number.ilike(search_term),
                        CardSet.set_name.ilike(search_term),
                        CardSeries.series_name.ilike(search_term)
                    )
                )

            count_query = session.query(func.count(func.distinct(Card.card_id))).select_from(
                Card
            ).join(
                CardSet, Card.card_set_id == CardSet.card_set_id
            ).join(
                CardSeries, CardSet.series_id == CardSeries.series_id
            ).outerjoin(
                latest_price_alias, Card.latest_price_id == latest_price_alias.price_id
            )

            if pokemonName:
                count_query = count_query.filter(Card.card_name.ilike(f"%{pokemonName}%"))

            if setName:
                count_query = count_query.filter(CardSet.set_name.ilike(f"%{setName}%"))

            if q:
                search_term = f"%{q.strip()}%"
                count_query = count_query.filter(
                    or_(
                        Card.card_name.ilike(search_term),
                        Card.card_number.ilike(search_term),
                        CardSet.set_name.ilike(search_term),
                        CardSeries.series_name.ilike(search_term)
                    )
                )

            if sortBy == SortBy.PRICE_ASC:
                query = query.order_by(asc(latest_price_alias.price))
            elif sortBy == SortBy.PRICE_DESC:
                query = query.order_by(desc(latest_price_alias.price))
            elif sortBy == SortBy.NAME_ASC:
                query = query.order_by(asc(Card.card_name))
            elif sortBy == SortBy.NAME_DESC:
                query = query.order_by(desc(Card.card_name))

            total_count = count_query.scalar()
            paginated_cards = query.offset(offset).limit(pageSize).all()
            cards_data = [card.to_dict() for card in paginated_cards]

            total_pages = (total_count + pageSize - 1) // pageSize

            logger.info(f"Query returned {len(paginated_cards)} cards out of {total_count} total")

            return JSONResponse(content={
                "cards": cards_data,
                "pagination": {
                    "page": page,
                    "pageSize": pageSize,
                    "totalCount": total_count,
                    "totalPages": total_pages,
                    "hasNext": page < total_pages,
                    "hasPrev": page > 1
                },
            })

        except Exception as e:
            logger.error(f"Error in /search: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "An error occurred while processing your request."})
        finally:
            if session:
                session.close()
                
    @router.post("/search/image")
    async def search_by_image(request: Request):
        try:
            data = await request.json()
            base64_image = data.get("image")
            embeddings = sagemaker_service.get_image_embeddings(base64_image)
            return JSONResponse(content={"embeddings": embeddings}, status_code=200)
        except Exception as e:
            logger.error(f"Error in /search/image: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "An error occurred while processing your request."})
        
    return router
