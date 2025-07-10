from pydantic import BaseModel, ConfigDict, HttpUrl
from typing import Optional, List, Dict, Literal


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


class CardImages(BaseModel):
    small: Optional[HttpUrl]
    large: Optional[HttpUrl]


class Ability(BaseModel):
    name: str
    text: str
    type: str


class Attack(BaseModel):
    name: str
    cost: Optional[List[str]]
    convertedEnergyCost: Optional[int]
    damage: Optional[str]
    text: Optional[str]


class WeaknessOrResistance(BaseModel):
    type: str
    value: str


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
    germanProLow: Optional[float] = None
    suggestedPrice: Optional[float] = None
    reverseHoloSell: Optional[float] = None
    reverseHoloLow: Optional[float] = None
    reverseHoloTrend: Optional[float] = None
    lowPriceExPlus: Optional[float] = None
    avg1: Optional[float] = None
    avg7: Optional[float] = None
    avg30: Optional[float] = None
    reverseHoloAvg1: Optional[float] = None
    reverseHoloAvg7: Optional[float] = None
    reverseHoloAvg30: Optional[float] = None


class CardMarket(BaseModel):
    url: Optional[HttpUrl]
    updatedAt: Optional[str]
    prices: Optional[CardMarketPrice]


class CardLegalities(BaseModel):
    unlimited: Optional[Literal["Legal", "Banned", "Unlimited"]]
    standard: Optional[Literal["Legal", "Banned", "Unlimited"]]
    expanded: Optional[Literal["Legal", "Banned", "Unlimited"]]


class SetImages(BaseModel):
    symbol: Optional[HttpUrl]
    logo: Optional[HttpUrl]


class CardSet(BaseModel):
    id: str
    name: str
    series: Optional[str]
    printedTotal: Optional[int]
    total: Optional[int]
    legalities: Optional[CardLegalities]
    ptcgoCode: Optional[str]
    releaseDate: Optional[str]
    updatedAt: Optional[str]
    images: Optional[SetImages]


class PTCGCard(BaseModel):
    model_config = {"extra": "ignore"}

    id: str
    name: str
    supertype: Optional[str]
    subtypes: Optional[List[str]]
    level: Optional[str]
    hp: Optional[str]
    types: Optional[List[str]]
    evolvesFrom: Optional[str]
    abilities: Optional[List[Ability]]
    attacks: Optional[List[Attack]]
    weaknesses: Optional[List[WeaknessOrResistance]]
    resistances: Optional[List[WeaknessOrResistance]]
    retreatCost: Optional[List[str]]
    convertedRetreatCost: Optional[int]
    number: Optional[str]
    artist: Optional[str]
    rarity: Optional[str]
    flavorText: Optional[str]
    nationalPokedexNumbers: Optional[List[int]]
    legalities: Optional[CardLegalities]
    images: Optional[CardImages]
    set: Optional[CardSet]
    tcgplayer: Optional[TcgPlayer]
    cardmarket: Optional[CardMarket]


class PTCGCardListResponse(BaseModel):
    data: List[PTCGCard]