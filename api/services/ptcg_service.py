from fastapi import HTTPException
import requests
from datetime import datetime

from sqlalchemy import Tuple
from response_models.ptcg import PTCGCard, PTCGCardListResponse, PTCGSetListResponse
from alchemy_models.card import Card
from alchemy_models.card_set import CardSet
from alchemy_models.card_series import CardSeries
from utils.logger import get_logger
from sqlalchemy.orm import Session
from typing import Dict, List

logger = get_logger(__name__)

class PTCGService:
    def __init__(self):
        self.PTCG_BASE_URL: str = "https://api.pokemontcg.io/v2"
        self.PTCG_IO_API_KEY: str = 'c03e92cf-e963-4c0b-acc2-f72de242aa92'

    def get_cards_for_set(self, set_id: str) -> PTCGCardListResponse:
        url = f"{self.PTCG_BASE_URL}/cards"
        headers = {
            "X-Api-Key": self.PTCG_IO_API_KEY
        }
        page = 1
        page_size = 250
        all_cards: List[PTCGCard] = []

        try:
            while True:
                params = {
                    "q": f"set.id:{set_id}",
                    "page": page,
                    "pageSize": page_size
                }

                logger.info(f"Fetching page {page} of cards for set {set_id}")
                response = requests.get(url, headers=headers, params=params)
                response.raise_for_status()

                data = response.json().get("data", [])
                if not data:
                    break

                all_cards.extend(PTCGCard(**card) for card in data)
                page += 1

            logger.info(f"Retrieved {len(all_cards)} cards for set {set_id}")
            return PTCGCardListResponse(data=all_cards)

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching cards for set {set_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error fetching cards for set: {str(e)}")

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

    def map_ptcg_sets_to_card_sets(
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

            try:
                release_date = datetime.strptime(ptcg_set.releaseDate, "%Y/%m/%d")
            except ValueError:
                release_date = None

            card_set = CardSet(
                provider_name='ptcg.io',
                provider_identifier=ptcg_set.id,
                set_name=ptcg_set.name,
                series_id=series.series_id,
                set_card_count=ptcg_set.total,
                set_logo_url=str(ptcg_set.images.logo) if ptcg_set.images and ptcg_set.images.logo else None,
                set_release_date=release_date,
            )
            card_sets.append(card_set)

        return card_sets
    
    def map_ptcg_cards_to_cards(
        self,
        mapped_ptcg_response: Dict[Tuple[str, str], PTCGCardListResponse],
    ) -> List[Card]:
        cards: List[Card] = []

        for (card_set_id, series_id), ptcg_card_list_response in mapped_ptcg_response.items():
            for ptcg_card in ptcg_card_list_response.data:
                card = Card(
                    provider_name='ptcg.io',
                    provider_identifier=ptcg_card.id,
                    card_name=ptcg_card.name,
                    card_rarity=ptcg_card.rarity,
                    types=ptcg_card.types or [],
                    card_price=ptcg_card.cardmarket.prices.avg1 if ptcg_card.cardmarket else 0.00,
                    card_image_url=str(ptcg_card.images.large) if ptcg_card.images and ptcg_card.images.large else None,
                    series_id=series_id,
                    card_set_id=card_set_id
                )
                cards.append(card)

        return cards
