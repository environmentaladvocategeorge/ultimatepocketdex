from fastapi import HTTPException
import requests
from alchemy_models.card_set import CardSet
from alchemy_models.card_series import CardSeries
from repository.postgresql_database import PostgresDatabase
from response_models.ptcg import PTCGSetListResponse
from utils.logger import get_logger
from sqlalchemy.orm import Session

logger = get_logger(__name__)

db = PostgresDatabase(
    host="ultimatepocketdex-dev-rds.chwiscumebq1.us-east-1.rds.amazonaws.com",
    database="upd-db",
    user="jorgelovesdata",
    password="Apple123Watch"
)
session = db.get_session()


class PTCGService:
    def __init__(self):
        self.PTCG_BASE_URL: str = "https://api.pokemontcg.io/v2"
        self.PTCG_IO_API_KEY: str = 'c03e92cf-e963-4c0b-acc2-f72de242aa92'

    def get_sets(self, db: Session) -> list[CardSet]:
        url = f"{self.PTCG_BASE_URL}/sets"
        headers = {
            "X-Api-Key": self.PTCG_IO_API_KEY
        }

        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()

            ptcg_sets = PTCGSetListResponse(**response.json())
            card_sets = self.map_ptcg_sets_to_card_sets(ptcg_sets, db)

            for card_set in card_sets:
                db.add(card_set)
            db.commit()

            return card_sets

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching card sets: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error fetching card sets: {str(e)}")

    def map_ptcg_sets_to_card_sets(
        self,
        ptcg_response: PTCGSetListResponse,
        db: Session
    ) -> list[CardSet]:
        card_sets: list[CardSet] = []

        for ptcg_set in ptcg_response.data:
            series = db.query(CardSeries).filter_by(series_name=ptcg_set.series).first()
            if not series:
                series = CardSeries(series_name=ptcg_set.series)
                db.add(series)
                db.flush() 

            existing_set = db.query(CardSet).filter_by(ptcgio_id=ptcg_set.id).first()
            if existing_set:
                continue

            card_set = CardSet(
                ptcgio_id=ptcg_set.id,
                set_name=ptcg_set.name,
                series_id=series.series_id,
                card_count=ptcg_set.total,
                logo_url=ptcg_set.images.logo,
            )
            card_sets.append(card_set)

        return card_sets
