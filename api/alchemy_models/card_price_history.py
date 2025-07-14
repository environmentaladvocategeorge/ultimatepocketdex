import json
import uuid
from sqlalchemy import (
    Column, DateTime, ForeignKey, Numeric
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from alchemy_models import Base

class CardPriceHistory(Base):
    __tablename__ = 'CardPriceHistory'

    price_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id = Column(UUID(as_uuid=True), ForeignKey('Card.card_id', ondelete="CASCADE"), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    card = relationship(
        "Card",
        back_populates="price_history",
        lazy="joined",
        foreign_keys=[card_id]
    )

    def to_dict(self):
        data = {
            'price_id': str(self.price_id),
            'card_id': str(self.card_id),
            'price': str(self.price),
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None,
        }

        if hasattr(self, 'card') and self.card:
            data['card'] = self.card.to_dict()

        return data

    def to_json(self):
        return json.dumps(self.to_dict())