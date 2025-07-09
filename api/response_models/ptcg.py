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
    printedTotal: Optional[int] = None
    total: int
    legalities: Optional[Legalities] = None
    ptcgoCode: Optional[str] = None
    releaseDate: Optional[str] = None
    updatedAt: Optional[str] = None
    images: Optional[SetImages] = None

class PTCGSetListResponse(BaseModel):
    data: list[PTCGSet]