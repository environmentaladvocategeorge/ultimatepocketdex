from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class PokemonSummaryModel(BaseModel):
    name: str
    url: HttpUrl

class PokemonListResponseModel(BaseModel):
    count: int
    next: Optional[HttpUrl]
    previous: Optional[HttpUrl]
    results: List[PokemonSummaryModel]

class PokemonTypeDetail(BaseModel):
    name: str


class PokemonType(BaseModel):
    slot: int
    type: PokemonTypeDetail

class PokemonSpecies(BaseModel):
    name: str
    url: HttpUrl

class PokemonSprites(BaseModel):
    front_default: Optional[str]

class PokemonDetailResponse(BaseModel):
    id: int
    name: str
    types: List[PokemonType]
    sprites: PokemonSprites
    species: PokemonSpecies
