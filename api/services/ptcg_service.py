from fastapi import HTTPException
import requests
from requests.exceptions import HTTPError
from datetime import datetime

from alchemy_models.card_price_history import CardPriceHistory
from response_models.ptcg import CardMarketPrice, PTCGCard, PTCGCardListResponse, PTCGSetListResponse, TcgPlayerPrices
from alchemy_models.card import Card
from alchemy_models.card_set import CardSet
from alchemy_models.card_series import CardSeries
from utils.logger import get_logger
from sqlalchemy.orm import Session
from typing import Dict, List, Optional, Tuple
import time

logger = get_logger(__name__)

NAME_MAP_EXCEPTIONS = {
    "Crown Zenith Galarian Gallery": "Crown Zenith: Galarian Gallery", 
    "151": "Scarlet & Violet: 151", 
    "Shining Fates Shiny Vault": "Shining Fates: Shiny Vault",
    "Astral Radiance Trainer Gallery": "Astral Radiance: Trainer Gallery",
    "Silver Tempest Trainer Gallery": "Silver Tempest: Trainer Gallery", 
    "Lost Origin Trainer Gallery": "Lost Origin: Trainer Gallery",
    "Brilliant Stars Trainer Gallery": "Brilliant Stars: Trainer Gallery",
    "Hidden Fates Shiny Vault": "Hidden Fates: Shiny Vault",
}

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
        pagination_timeout_seconds = 120

        start_time = time.time()

        try:
            while True:
                elapsed = time.time() - start_time
                if elapsed > pagination_timeout_seconds:
                    logger.warning(f"Pagination timeout exceeded while fetching cards for set {set_id}")
                    raise HTTPException(status_code=504, detail=f"Timeout exceeded fetching cards for set {set_id}")

                params = {
                    "q": f"set.id:{set_id}",
                    "page": page,
                    "pageSize": page_size
                }

                logger.info(f"Fetching page {page} of cards for set {set_id}")
                try:
                    response = requests.get(url, headers=headers, params=params, timeout=30)
                    response.raise_for_status()
                except HTTPError as e:
                    if response.status_code == 404:
                        logger.info(f"Received 404 for page {page} of set {set_id}, assuming no more cards.")
                        break
                    else:
                        logger.error(f"Error fetching cards for set {set_id}: {str(e)}")
                        raise HTTPException(status_code=500, detail=f"Error fetching cards for set: {str(e)}")

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
                set_name=NAME_MAP_EXCEPTIONS.get(ptcg_set.name, ptcg_set.name).replace("Black Star ", ""),
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
                price = self.calculate_accurate_card_price(
                    (tp := ptcg_card.tcgplayer and ptcg_card.tcgplayer.prices) and (
                        tp.get("normal") or
                        tp.get("1stEditionNormal") or
                        tp.get("holofoil") or
                        tp.get("1stEditionHolofoil") or
                        tp.get("reverseHolofoil") or
                        tp.get("unlimitedHolofoil")
                    ),
                    ptcg_card.cardmarket.prices if ptcg_card.cardmarket else None
                )

                card_number = ptcg_card.number
                printed_total = ptcg_card.set.printedTotal
                set_name = ptcg_card.set.name
                if set_name == "Crown Zenith Galarian Gallery":
                    card_number = f"{card_number}/GG{printed_total}"
                elif set_name == "Shiny Vault" in set_name:
                    card_number = f"{card_number}/SV{printed_total}"
                elif "Trainer Gallery" in set_name:
                    card_number = f"{card_number}/TG{printed_total}"
                elif (
                    printed_total
                    and isinstance(card_number, str)
                    and card_number.isdigit()
                    and "Black Star" not in set_name
                ):
                    pad_length = len(str(printed_total))
                    card_number = f"{int(card_number):0{pad_length}d}/{printed_total}"

                card = Card(
                    provider_name='ptcg.io',
                    provider_identifier=ptcg_card.id,
                    card_name=ptcg_card.name,
                    card_rarity=ptcg_card.rarity,
                    types=ptcg_card.types or [],
                    card_number=card_number,
                    card_image_url=str(ptcg_card.images.large) if ptcg_card.images and ptcg_card.images.large else None,
                    series_id=series_id,
                    card_set_id=card_set_id
                )

                price_history = CardPriceHistory(
                    card_id=card.card_id,
                    price=price
                )

                card.latest_price_id = price_history.price_id

                cards.append((card, price_history))

        return cards

    def calculate_accurate_card_price(
        self,
        tcgplayer_data: Optional[TcgPlayerPrices],
        cardmarket_data: Optional[CardMarketPrice]
    ) -> float:
        def get_attr_safe(obj, attr):
            return getattr(obj, attr, None) if obj is not None else None

        mid = get_attr_safe(tcgplayer_data, 'mid')
        market = get_attr_safe(tcgplayer_data, 'market')
        direct_low = get_attr_safe(tcgplayer_data, 'directLow')
        avg_sell = get_attr_safe(cardmarket_data, 'averageSellPrice')
        suggested = get_attr_safe(cardmarket_data, 'suggestedPrice')
        trend = get_attr_safe(cardmarket_data, 'trendPrice')

        weighted_sum = 0.0
        total_weight = 0.0

        def add_price(price, weight):
            nonlocal weighted_sum, total_weight
            if price is not None:
                weighted_sum += price * weight
                total_weight += weight

        add_price(mid, 0.35)
        add_price(market, 0.25)
        add_price(direct_low, 0.10)
        add_price(avg_sell, 0.15)
        add_price(suggested, 0.10)
        add_price(trend, 0.05)

        if total_weight == 0:
            return 0.0

        base_price = weighted_sum / total_weight

        if trend is not None and base_price != 0:
            adjustment_factor = 1 + (trend - base_price) / base_price * 0.1
            base_price *= adjustment_factor

        return round(base_price, 2)

