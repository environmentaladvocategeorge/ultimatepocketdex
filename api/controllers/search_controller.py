import json
import os
from typing import Optional
import uuid
import boto3
from fastapi import APIRouter, Query, UploadFile, File, Request, HTTPException
from fastapi.responses import JSONResponse
import requests
from sqlalchemy import desc, asc, func
from sqlalchemy.orm import joinedload, aliased
from sqlalchemy.sql import or_
from sqlalchemy.exc import SQLAlchemyError
from alchemy_models.card_price_history import CardPriceHistory
from alchemy_models.card_series import CardSeries
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

        except SQLAlchemyError as e:
            logger.error(f"Database error: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        finally:
            if session: 
                session.close()

    @router.post("/search/image")
    async def search_by_image(request: Request, image: UploadFile = File(...)):
        try:
            logger.info(f"Received image: {image.filename}")

            image_bytes = await image.read()

            s3_client = boto3.client("s3", region_name="us-east-1")
            bucket_name = os.environ.get("DATA_BUCKET_NAME")
            image_key = f"uploads/{uuid.uuid4()}_{image.filename}"

            logger.info(f"Uploading image to S3: {bucket_name}/{image_key}")
            s3_client.put_object(
                Bucket=bucket_name,
                Key=image_key,
                Body=image_bytes,
                ContentType=image.content_type
            )

            s3_uri = f"s3://{bucket_name}/{image_key}"
            logger.info(f"Image uploaded to {s3_uri}")

            sagemaker_runtime = boto3.client("sagemaker-runtime", region_name="us-east-1")
            OPENCLIP_ENDPOINT_NAME = os.environ.get("OPENCLIP_ENDPOINT_NAME")

            payload = {"inputs": s3_uri}
            logger.info(f"Invoking SageMaker endpoint: {OPENCLIP_ENDPOINT_NAME} with payload: {payload}")

            response = sagemaker_runtime.invoke_endpoint(
                EndpointName=OPENCLIP_ENDPOINT_NAME,
                ContentType="application/json",
                Body=json.dumps(payload)
            )

            result = response["Body"].read().decode("utf-8")
            logger.info(f"Inference result: {result}")

            return JSONResponse(content={"inference": result}, status_code=200)

        except HTTPException as he:
            logger.error(f"HTTP error: {he.detail}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in /search/image: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})

    return router