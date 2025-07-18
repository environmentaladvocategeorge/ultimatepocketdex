from pydantic import BaseModel

class AddCardRequest(BaseModel):
    card_id: str
    quantity: int = 1