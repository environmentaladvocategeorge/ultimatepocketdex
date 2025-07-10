from fastapi import HTTPException
import requests
from response_models.ptcg import PTCGSetListResponse
from alchemy_models.card_set import CardSet
from alchemy_models.card_series import CardSeries
from utils.logger import get_logger
from sqlalchemy.orm import Session
from typing import List

logger = get_logger(__name__)

class PTCGService:
    def __init__(self):
        self.PTCG_BASE_URL: str = "https://api.pokemontcg.io/v2"
        self.PTCG_IO_API_KEY: str = 'c03e92cf-e963-4c0b-acc2-f72de242aa92'

    def get_sets(self) -> PTCGSetListResponse:
        url = f"{self.PTCG_BASE_URL}/sets"
        headers = {
            "X-Api-Key": self.PTCG_IO_API_KEY
        }

        try:
            logger.info(f"Fetching card sets from {url}")
            response = requests.get(url, headers=headers)
            response.raise_for_status()

            return PTCGSetListResponse(**response.json())

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching card sets: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error fetching card sets: {str(e)}")

    def _map_ptcg_sets_to_card_sets(
        self,
        ptcg_response: PTCGSetListResponse,
        db: Session
    ) -> List[CardSet]:
        card_sets: List[CardSet] = []

        for ptcg_set in ptcg_response.data:
            series = db.query(CardSeries).filter_by(series_name=ptcg_set.series).first()
            if not series:
                series = CardSeries(series_name=ptcg_set.series)
                db.add(series)
                db.flush()

            card_set = CardSet(
                provider_name='ptcg.io',
                provider_identifier=ptcg_set.id,
                set_name=ptcg_set.name,
                series_id=series.series_id,
                card_count=ptcg_set.total,
                logo_url=str(ptcg_set.images.logo) if ptcg_set.images and ptcg_set.images.logo else None,
            )
            card_sets.append(card_set)

        return card_sets

