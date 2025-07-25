import base64
import json
import os
from typing import Optional
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

sagemaker_runtime = boto3.client("sagemaker-runtime", region_name="us-east-1")
OPENCLIP_ENDPOINT_NAME = os.environ.get("OPENCLIP_ENDPOINT_NAME")

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
            logger.info(f"Image size: {len(image_bytes)} bytes")
            
            sagemaker_runtime = boto3.client("sagemaker-runtime", region_name="us-east-1")
            OPENCLIP_ENDPOINT_NAME = os.environ.get("OPENCLIP_ENDPOINT_NAME")
            
            # Method 1: Standard base64 with inputs wrapper
            try:
                logger.info("Trying Method 1: Standard base64 with inputs wrapper")
                image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                payload = {"inputs": image_b64}
                
                response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=OPENCLIP_ENDPOINT_NAME,
                    ContentType="application/json",
                    Body=json.dumps(payload)
                )
                result = response["Body"].read().decode("utf-8")
                logger.info("✅ Method 1 SUCCESS")
                return JSONResponse(content={"inference": result, "method": "inputs_wrapper"}, status_code=200)
                
            except Exception as e1:
                logger.info(f"❌ Method 1 failed: {str(e1)}")
            
            # Method 2: Base64 with image key
            try:
                logger.info("Trying Method 2: Base64 with image key")
                image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                payload = {"image": image_b64}
                
                response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=OPENCLIP_ENDPOINT_NAME,
                    ContentType="application/json",
                    Body=json.dumps(payload)
                )
                result = response["Body"].read().decode("utf-8")
                logger.info("✅ Method 2 SUCCESS")
                return JSONResponse(content={"inference": result, "method": "image_key"}, status_code=200)
                
            except Exception as e2:
                logger.info(f"❌ Method 2 failed: {str(e2)}")
            
            # Method 3: AWS instances format
            try:
                logger.info("Trying Method 3: AWS instances format")
                image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                payload = {"instances": [{"image": image_b64}]}
                
                response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=OPENCLIP_ENDPOINT_NAME,
                    ContentType="application/json",
                    Body=json.dumps(payload)
                )
                result = response["Body"].read().decode("utf-8")
                logger.info("✅ Method 3 SUCCESS")
                return JSONResponse(content={"inference": result, "method": "instances_format"}, status_code=200)
                
            except Exception as e3:
                logger.info(f"❌ Method 3 failed: {str(e3)}")
            
            # Method 4: AWS instances with data wrapper
            try:
                logger.info("Trying Method 4: AWS instances with data wrapper")
                image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                payload = {"instances": [{"data": {"b64": image_b64}}]}
                
                response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=OPENCLIP_ENDPOINT_NAME,
                    ContentType="application/json",
                    Body=json.dumps(payload)
                )
                result = response["Body"].read().decode("utf-8")
                logger.info("✅ Method 4 SUCCESS")
                return JSONResponse(content={"inference": result, "method": "instances_data_wrapper"}, status_code=200)
                
            except Exception as e4:
                logger.info(f"❌ Method 4 failed: {str(e4)}")
            
            # Method 5: HuggingFace format with inputs object
            try:
                logger.info("Trying Method 5: HuggingFace format with inputs object")
                image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                payload = {"inputs": {"image": image_b64}}
                
                response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=OPENCLIP_ENDPOINT_NAME,
                    ContentType="application/json",
                    Body=json.dumps(payload)
                )
                result = response["Body"].read().decode("utf-8")
                logger.info("✅ Method 5 SUCCESS")
                return JSONResponse(content={"inference": result, "method": "huggingface_format"}, status_code=200)
                
            except Exception as e5:
                logger.info(f"❌ Method 5 failed: {str(e5)}")
            
            # Method 6: Data URI format (what you originally had)
            try:
                logger.info("Trying Method 6: Data URI format")
                image_b64 = "data:image/jpeg;base64," + base64.b64encode(image_bytes).decode('utf-8')
                payload = {"inputs": image_b64}
                
                response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=OPENCLIP_ENDPOINT_NAME,
                    ContentType="application/json",
                    Body=json.dumps(payload)
                )
                result = response["Body"].read().decode("utf-8")
                logger.info("✅ Method 6 SUCCESS")
                return JSONResponse(content={"inference": result, "method": "data_uri_format"}, status_code=200)
                
            except Exception as e6:
                logger.info(f"❌ Method 6 failed: {str(e6)}")
            
            # Method 7: URL-safe base64
            try:
                logger.info("Trying Method 7: URL-safe base64")
                image_b64 = base64.urlsafe_b64encode(image_bytes).decode('utf-8')
                payload = {"inputs": image_b64}
                
                response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=OPENCLIP_ENDPOINT_NAME,
                    ContentType="application/json",
                    Body=json.dumps(payload)
                )
                result = response["Body"].read().decode("utf-8")
                logger.info("✅ Method 7 SUCCESS")
                return JSONResponse(content={"inference": result, "method": "urlsafe_base64"}, status_code=200)
                
            except Exception as e7:
                logger.info(f"❌ Method 7 failed: {str(e7)}")
            
            # Method 8: Simple data key
            try:
                logger.info("Trying Method 8: Simple data key")
                image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                payload = {"data": image_b64}
                
                response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=OPENCLIP_ENDPOINT_NAME,
                    ContentType="application/json",
                    Body=json.dumps(payload)
                )
                result = response["Body"].read().decode("utf-8")
                logger.info("✅ Method 8 SUCCESS")
                return JSONResponse(content={"inference": result, "method": "simple_data_key"}, status_code=200)
                
            except Exception as e8:
                logger.info(f"❌ Method 8 failed: {str(e8)}")
            
            # Method 9: Raw base64 string (no JSON wrapper)
            try:
                logger.info("Trying Method 9: Raw base64 string")
                image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                
                response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=OPENCLIP_ENDPOINT_NAME,
                    ContentType="application/json",
                    Body=image_b64  # Just the string, no JSON
                )
                result = response["Body"].read().decode("utf-8")
                logger.info("✅ Method 9 SUCCESS")
                return JSONResponse(content={"inference": result, "method": "raw_base64_string"}, status_code=200)
                
            except Exception as e9:
                logger.info(f"❌ Method 9 failed: {str(e9)}")
            
            # Method 10: Base64 with explicit encoding
            try:
                logger.info("Trying Method 10: Base64 with explicit encoding")
                image_b64 = base64.b64encode(image_bytes).decode('ascii')  # Use ASCII instead of UTF-8
                payload = {"inputs": image_b64}
                
                response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=OPENCLIP_ENDPOINT_NAME,
                    ContentType="application/json",
                    Body=json.dumps(payload)
                )
                result = response["Body"].read().decode("utf-8")
                logger.info("✅ Method 10 SUCCESS")
                return JSONResponse(content={"inference": result, "method": "ascii_encoding"}, status_code=200)
                
            except Exception as e10:
                logger.info(f"❌ Method 10 failed: {str(e10)}")
            
            # If all methods fail, return detailed error info
            error_details = {
                "message": "All methods failed",
                "errors": {
                    "method_1_inputs_wrapper": str(e1),
                    "method_2_image_key": str(e2),
                    "method_3_instances_format": str(e3),
                    "method_4_instances_data_wrapper": str(e4),
                    "method_5_huggingface_format": str(e5),
                    "method_6_data_uri_format": str(e6),
                    "method_7_urlsafe_base64": str(e7),
                    "method_8_simple_data_key": str(e8),
                    "method_9_raw_base64_string": str(e9),
                    "method_10_ascii_encoding": str(e10)
                }
            }
            
            logger.error("❌ ALL METHODS FAILED")
            return JSONResponse(status_code=500, content=error_details)

        except HTTPException as he:
            logger.error(f"HTTP error: {he.detail}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in /search/image: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error", "error": str(e)})

    return router