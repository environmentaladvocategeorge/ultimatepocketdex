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