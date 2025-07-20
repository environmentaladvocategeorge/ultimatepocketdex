from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import desc
from alchemy_models.user import User
from alchemy_models.card import Card
from alchemy_models.user_card import UserCard
from api_models.requests import AddCardRequest
from repository.postgresql_database import PostgresDatabase
from services.cognito_service import CognitoService
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()
db = PostgresDatabase(
    host="ultimatepocketdex-dev-rds.chwiscumebq1.us-east-1.rds.amazonaws.com",
    database="upd-db",
    user="jorgelovesdata",
    password="Apple123Watch"
)
cognito_service = CognitoService()

def create_user_controller():  
    @router.get("/user")
    async def get_user(user: User = Depends(cognito_service.extract_token)):
        session = db.get_session()
        try:
            logger.info(f"User {user.user_id} requested their own profile.")
            
            existing_user = session.query(User).filter_by(user_id=user.user_id).first()

            if not existing_user:
                logger.info(f"User {user.user_id} not found in database. Creating new user.")

                new_user = User(
                    user_id=user.user_id,
                    user_name=user.user_name,
                    email_address=user.email_address
                )
                session.add(new_user)
                session.commit()
                user_dict = new_user.to_dict()
            else:
                user_dict = existing_user.to_dict()

            return JSONResponse(content=user_dict)

        except Exception as e:
            logger.error(f"Error retrieving or creating user profile: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        finally:
            session.close()

    @router.post("/user/card")
    async def add_card_to_user(request: AddCardRequest, user: User = Depends(cognito_service.extract_token)):
        session = db.get_session()
        try:
            card_id = request.card_id
            quantity = request.quantity
            card = session.query(Card).filter_by(card_id=card_id).first()
            if not card:
                raise HTTPException(status_code=404, detail="Card not found")

            user_card = session.query(UserCard).filter_by(user_id=user.user_id, card_id=card_id).first()

            if user_card:
                user_card.quantity += quantity
                logger.info(f"Updated quantity of card {card_id} for user {user.user_id}")
            else:
                user_card = UserCard(user_id=user.user_id, card_id=card_id, quantity=quantity)
                session.add(user_card)
                logger.info(f"Added card {card_id} to user {user.user_id}")

            session.commit()
            return JSONResponse(content={"message": "Card added to user successfully"})
        except Exception as e:
            session.rollback()
            logger.error(f"Error adding card to user: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        finally:
            session.close()

    @router.get("/user/card")
    async def get_user_cards(user: User = Depends(cognito_service.extract_token)):
        session = db.get_session()
        try:
            user_cards = (
                session.query(UserCard)
                .filter(UserCard.user_id == user.user_id, UserCard.quantity > 0)
                .order_by(desc(UserCard.updated_ts))
                .all()
            )
            response = [uc.to_dict() for uc in user_cards]
            return JSONResponse(content=response)
        except Exception as e:
            logger.error(f"Error fetching user cards: {str(e)}")
            return JSONResponse(status_code=500, content={"message": "Internal Server Error"})
        finally:
            session.close()

    return router
