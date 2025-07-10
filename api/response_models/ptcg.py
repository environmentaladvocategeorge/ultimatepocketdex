from pydantic import BaseModel, ConfigDict, HttpUrl
from typing import Optional, Literal


class SetImages(BaseModel):
    symbol: HttpUrl
    logo: HttpUrl


class Legalities(BaseModel):
    unlimited: Optional[Literal["Legal", "Banned", "Unlimited"]]
    
class PTCGSet(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    series: str
    printedTotal: int
    total: int
    legalities: Optional[Legalities] = None
    ptcgoCode: Optional[str] = None
    releaseDate: str
    updatedAt: str
    images: SetImages

class PTCGSetListResponse(BaseModel):
    data: list[PTCGSet]

from pydantic import BaseModel, ConfigDict, HttpUrl
from typing import Optional, List, Literal, Dict


class CardImages(BaseModel):
    small: HttpUrl
    large: HttpUrl


class TcgPlayerPrices(BaseModel):
    low: Optional[float]
    mid: Optional[float]
    high: Optional[float]
    market: Optional[float]
    directLow: Optional[float]


class TcgPlayer(BaseModel):
    url: Optional[HttpUrl]
    updatedAt: Optional[str]
    prices: Optional[Dict[str, TcgPlayerPrices]]


class CardMarketPrice(BaseModel):
    averageSellPrice: Optional[float]
    lowPrice: Optional[float]
    trendPrice: Optional[float]
    reverseHoloTrend: Optional[float]


class CardMarket(BaseModel):
    url: Optional[HttpUrl]
    updatedAt: Optional[str]
    prices: Optional[CardMarketPrice]


class CardLegalities(BaseModel):
    unlimited: Optional[Literal["Legal", "Banned", "Unlimited"]]
    standard: Optional[Literal["Legal", "Banned", "Unlimited"]]
    expanded: Optional[Literal["Legal", "Banned", "Unlimited"]]


class PTCGCard(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    supertype: Optional[str]
    subtypes: Optional[List[str]]
    level: Optional[str]
    hp: Optional[str]
    types: Optional[List[str]]
    evolvesFrom: Optional[str]
    abilities: Optional[List[Dict[str, str]]]
    attacks: Optional[List[Dict[str, str]]]
    weaknesses: Optional[List[Dict[str, str]]]
    resistances: Optional[List[Dict[str, str]]]
    retreatCost: Optional[List[str]]
    convertedRetreatCost: Optional[int]
    number: Optional[str]
    artist: Optional[str]
    rarity: Optional[str]
    nationalPokedexNumbers: Optional[List[int]]
    legalities: Optional[CardLegalities]
    images: Optional[CardImages]
    tcgplayer: Optional[TcgPlayer]
    cardmarket: Optional[CardMarket]


class PTCGCardListResponse(BaseModel):
    data: List[PTCGCard]