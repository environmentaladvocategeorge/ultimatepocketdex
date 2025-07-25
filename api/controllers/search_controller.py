import base64
import json
import os
import re
from typing import Optional
import boto3
from fastapi import APIRouter, Query, Request, HTTPException
from fastapi.responses import JSONResponse
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
from PIL import Image
import io

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
    async def search_by_image(request: Request):
        try:
            data = await request.json()
            base64_image = data.get("image")

            if not base64_image:
                return JSONResponse(status_code=400, content={"message": "No image data provided."})
            
            base64_str = re.sub(r"^data:image/\w+;base64,", "", base64_image)

            try:
                image_bytes = base64.b64decode(base64_str)
            except Exception as decode_err:
                logger.error(f"Failed to decode base64 image: {decode_err}")
                return JSONResponse(status_code=400, content={"message": "Invalid base64 image data."})
            
            try:
                Image.open(io.BytesIO(image_bytes)).verify()
            except Exception as img_err:
                logger.error(f"Uploaded base64 is not a valid image: {img_err}")
                return JSONResponse(status_code=400, content={"message": "Uploaded data is not a valid image."})

            sagemaker_runtime = boto3.client("sagemaker-runtime", region_name="us-east-1")
            OPENCLIP_ENDPOINT_NAME = os.environ.get("OPENCLIP_ENDPOINT_NAME")
            
            errors = []
            
            # Solution 1: Try sending as nested inputs
            try:
                logger.info("Attempting Solution 1: Nested inputs format")
                payload_1 = {
                    "inputs": {
                        "image": base64_image
                    }
                }
                
                response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=OPENCLIP_ENDPOINT_NAME,
                    ContentType="application/json",
                    Body=json.dumps(payload_1)
                )
                
                raw_result = response["Body"].read()
                logger.info(f"Solution 1 - SageMaker raw response: {raw_result}")
                
                result = json.loads(raw_result.decode("utf-8"))
                logger.info("Solution 1 succeeded!")
                return JSONResponse(content={"embeddings": result}, status_code=200)
                
            except Exception as e1:
                error_msg_1 = f"Solution 1 failed: {str(e1)}"
                logger.error(error_msg_1)
                errors.append(error_msg_1)
            
            # Solution 2: Try simple inputs with parameters
            try:
                logger.info("Attempting Solution 2: Simple inputs with parameters")
                payload_2 = {
                    "inputs": base64_image,
                    "parameters": {
                        "task": "feature-extraction"
                    }
                }
                
                response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=OPENCLIP_ENDPOINT_NAME,
                    ContentType="application/json",
                    Body=json.dumps(payload_2)
                )
                
                raw_result = response["Body"].read()
                logger.info(f"Solution 2 - SageMaker raw response: {raw_result}")
                
                result = json.loads(raw_result.decode("utf-8"))
                logger.info("Solution 2 succeeded!")
                return JSONResponse(content={"embeddings": result}, status_code=200)
                
            except Exception as e2:
                error_msg_2 = f"Solution 2 failed: {str(e2)}"
                logger.error(error_msg_2)
                errors.append(error_msg_2)
            
            # Solution 3: Try preprocessing the image
            try:
                logger.info("Attempting Solution 3: Preprocessed image")
                image = Image.open(io.BytesIO(image_bytes))
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Convert PIL image back to base64
                buffered = io.BytesIO()
                image.save(buffered, format="JPEG")
                processed_image_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                
                payload_3 = {
                    "inputs": f"data:image/jpeg;base64,{processed_image_b64}"
                }
                
                response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=OPENCLIP_ENDPOINT_NAME,
                    ContentType="application/json",
                    Body=json.dumps(payload_3)
                )
                
                raw_result = response["Body"].read()
                logger.info(f"Solution 3 - SageMaker raw response: {raw_result}")
                
                result = json.loads(raw_result.decode("utf-8"))
                logger.info("Solution 3 succeeded!")
                return JSONResponse(content={"embeddings": result}, status_code=200)
                
            except Exception as e3:
                error_msg_3 = f"Solution 3 failed: {str(e3)}"
                logger.error(error_msg_3)
                errors.append(error_msg_3)
            
            # If all solutions fail, return aggregated errors
            logger.error("All solutions failed. Aggregated errors:")
            for i, error in enumerate(errors, 1):
                logger.error(f"  {i}. {error}")
            
            return JSONResponse(
                status_code=500, 
                content={
                    "message": "All image processing solutions failed",
                    "errors": errors,
                    "attempted_solutions": [
                        "Nested inputs format: {'inputs': {'image': base64_image}}",
                        "Simple inputs with parameters: {'inputs': base64_image, 'parameters': {'task': 'feature-extraction'}}",
                        "Preprocessed RGB image: {'inputs': 'data:image/jpeg;base64,processed_image'}"
                    ]
                }
            )

        except HTTPException as he:
            logger.error(f"HTTP error: {he.detail}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in /search/image: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
            
    return router