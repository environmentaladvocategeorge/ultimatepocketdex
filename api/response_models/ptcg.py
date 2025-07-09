from pydantic import BaseModel, HttpUrl
from typing import Optional, Literal


class SetImages(BaseModel):
    symbol: HttpUrl
    logo: HttpUrl


class Legalities(BaseModel):
    unlimited: Optional[Literal["Legal", "Banned", "Unlimited"]]
    
class PTCGSet(BaseModel):
    id: str
    name: str
    series: str
    printedTotal: Optional[int]
    total: int
    legalities: Optional[Legalities]
    ptcgoCode: Optional[str]
    releaseDate: Optional[str]
    updatedAt: Optional[str]
    images: Optional[SetImages]

class PTCGSetListResponse(BaseModel):
    data: list[PTCGSet]