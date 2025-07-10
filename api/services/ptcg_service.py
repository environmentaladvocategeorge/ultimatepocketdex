from fastapi import HTTPException
import requests
from datetime import datetime

from response_models.ptcg import PTCGCard, PTCGCardListResponse, PTCGSetListResponse
from alchemy_models.card import Card
from alchemy_models.card_set import CardSet
from alchemy_models.card_series import CardSeries
from utils.logger import get_logger
from sqlalchemy.orm import Session
from typing import Dict, List, Tuple

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
                    card_price=self.calculate_accurate_card_price(ptcg_card.tcgplayer, ptcg_card.cardmarket),
                    card_image_url=str(ptcg_card.images.large) if ptcg_card.images and ptcg_card.images.large else None,
                    series_id=series_id,
                    card_set_id=card_set_id
                )
                cards.append(card)

        return cards

    def calculate_accurate_card_price(tcgplayer_data, cardmarket_data, card_type='normal'):
        """
        Calculate an accurate card price using both TCGPlayer and Cardmarket data.
        
        Args:
            tcgplayer_data: Dictionary containing TCGPlayer price data
            cardmarket_data: Dictionary containing Cardmarket price data  
            card_type: 'normal' or 'reverseHolofoil' for TCGPlayer data
        
        Returns:
            Dictionary with calculated prices and confidence metrics
        """
        
        # Extract TCGPlayer prices (prioritize market price as it's most accurate)
        tcg_prices = tcgplayer_data.get('prices', {}).get(card_type, {})
        tcg_market = tcg_prices.get('market')
        tcg_mid = tcg_prices.get('mid')
        
        # Extract Cardmarket prices
        cm_prices = cardmarket_data.get('prices', {})
        cm_trend = cm_prices.get('trendPrice')
        cm_avg_sell = cm_prices.get('averageSellPrice')
        cm_avg7 = cm_prices.get('avg7')  # 7-day average
        cm_avg30 = cm_prices.get('avg30')  # 30-day average
        
        # Calculate weighted average based on data reliability
        price_components = []
        weights = []
        
        # TCGPlayer market price (highest weight - most accurate according to research)
        if tcg_market:
            price_components.append(tcg_market)
            weights.append(0.35)  # 35% weight
        
        # Cardmarket trend price (second highest weight)
        if cm_trend:
            price_components.append(cm_trend)
            weights.append(0.25)  # 25% weight
        
        # Cardmarket average sell price
        if cm_avg_sell:
            price_components.append(cm_avg_sell)
            weights.append(0.20)  # 20% weight
        
        # TCGPlayer mid price (lower weight as it's less accurate than market)
        if tcg_mid:
            price_components.append(tcg_mid)
            weights.append(0.10)  # 10% weight
        
        # Recent averages from Cardmarket (7-day preferred over 30-day)
        if cm_avg7:
            price_components.append(cm_avg7)
            weights.append(0.10)  # 10% weight
        elif cm_avg30:
            price_components.append(cm_avg30)
            weights.append(0.10)  # 10% weight
        
        if price_components and weights:
            total_weight = sum(weights)
            normalized_weights = [w/total_weight for w in weights]
            
            weighted_price = sum(price * weight for price, weight in zip(price_components, normalized_weights))
        else:
            weighted_price = None
        
        all_prices = []
        if tcg_market: all_prices.append(tcg_market)
        if tcg_mid: all_prices.append(tcg_mid)
        if cm_trend: all_prices.append(cm_trend)
        if cm_avg_sell: all_prices.append(cm_avg_sell)
        if cm_avg7: all_prices.append(cm_avg7)
        
        confidence_score = 0
        price_variance = 0
        
        if len(all_prices) >= 2:
            avg_price = sum(all_prices) / len(all_prices)
            price_variance = sum((p - avg_price) ** 2 for p in all_prices) / len(all_prices)
            
            confidence_score = min(100, (len(all_prices) * 20) - (price_variance * 5))
            confidence_score = max(0, confidence_score)

        return round(weighted_price, 2) if weighted_price else None