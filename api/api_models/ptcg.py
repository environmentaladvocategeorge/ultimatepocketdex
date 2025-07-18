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


from typing import Optional, List, Dict, Literal
from pydantic import BaseModel, HttpUrl


class CardImages(BaseModel):
    small: Optional[HttpUrl] = None
    large: Optional[HttpUrl] = None


class Ability(BaseModel):
    name: str
    text: str
    type: str


class Attack(BaseModel):
    name: str
    cost: Optional[List[str]] = None
    convertedEnergyCost: Optional[int] = None
    damage: Optional[str] = None
    text: Optional[str] = None


class WeaknessOrResistance(BaseModel):
    type: str
    value: str


class TcgPlayerPrices(BaseModel):
    low: Optional[float] = None
    mid: Optional[float] = None
    high: Optional[float] = None
    market: Optional[float] = None
    directLow: Optional[float] = None


class TcgPlayer(BaseModel):
    url: Optional[HttpUrl] = None
    updatedAt: Optional[str] = None
    prices: Optional[Dict[str, TcgPlayerPrices]] = None


class CardMarketPrice(BaseModel):
    averageSellPrice: Optional[float] = None
    lowPrice: Optional[float] = None
    trendPrice: Optional[float] = None
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
    url: Optional[HttpUrl] = None
    updatedAt: Optional[str] = None
    prices: Optional[CardMarketPrice] = None


class CardLegalities(BaseModel):
    unlimited: Optional[Literal["Legal", "Banned", "Unlimited"]] = None
    standard: Optional[Literal["Legal", "Banned", "Unlimited"]] = None
    expanded: Optional[Literal["Legal", "Banned", "Unlimited"]] = None


class SetImages(BaseModel):
    symbol: Optional[HttpUrl] = None
    logo: Optional[HttpUrl] = None


class CardSet(BaseModel):
    id: str
    name: str
    series: Optional[str] = None
    printedTotal: Optional[int] = None
    total: Optional[int] = None
    legalities: Optional[CardLegalities] = None
    ptcgoCode: Optional[str] = None
    releaseDate: Optional[str] = None
    updatedAt: Optional[str] = None
    images: Optional[SetImages] = None


class PTCGCard(BaseModel):
    model_config = {"extra": "ignore"}

    id: str
    name: str
    number: str = None
    supertype: Optional[str] = None
    subtypes: Optional[List[str]] = None
    level: Optional[str] = None
    hp: Optional[str] = None
    types: Optional[List[str]] = None
    evolvesFrom: Optional[str] = None
    abilities: Optional[List[Ability]] = None
    attacks: Optional[List[Attack]] = None
    weaknesses: Optional[List[WeaknessOrResistance]] = None
    resistances: Optional[List[WeaknessOrResistance]] = None
    retreatCost: Optional[List[str]] = None
    convertedRetreatCost: Optional[int] = None
    artist: Optional[str] = None
    rarity: Optional[str] = None
    flavorText: Optional[str] = None
    nationalPokedexNumbers: Optional[List[int]] = None
    legalities: Optional[CardLegalities] = None
    images: Optional[CardImages] = None
    set: Optional[CardSet] = None
    tcgplayer: Optional[TcgPlayer] = None
    cardmarket: Optional[CardMarket] = None


class PTCGCardListResponse(BaseModel):
    data: List[PTCGCard]