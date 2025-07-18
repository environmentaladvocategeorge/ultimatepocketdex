import uuid
import json
from sqlalchemy import (
    Column, String, DateTime, ForeignKey, UniqueConstraint, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from alchemy_models import Base
from utils.uuid_generator import UUIDGenerator

class Card(Base):
    __tablename__ = 'Card'
    __table_args__ = (
        UniqueConstraint('provider_name', 'provider_identifier', name='Card_provider_unique'),
    )

    card_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    provider_name = Column(String(100), nullable=False)
    provider_identifier = Column(String(255), nullable=False)

    series_id = Column(UUID(as_uuid=True), ForeignKey('CardSeries.series_id'), nullable=False)
    card_set_id = Column(UUID(as_uuid=True), ForeignKey('CardSet.card_set_id'), nullable=False)

    card_name = Column(String(255), nullable=False)
    card_number = Column(String(50), nullable=False)
    card_rarity = Column(String(100), nullable=True)
    card_image_url = Column(String(1024), nullable=True)
    types = Column(ARRAY(String(50)), default=list)

    latest_price_id = Column(UUID(as_uuid=True), ForeignKey('CardPriceHistory.price_id', ondelete="SET NULL"))

    create_ts = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_ts = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    series = relationship("CardSeries", back_populates="cards", lazy="joined")
    card_set = relationship("CardSet", back_populates="cards", lazy="joined")

    owners = relationship("UserCard", back_populates="card", lazy="select")

    latest_price = relationship("CardPriceHistory", foreign_keys=[latest_price_id], lazy="joined")
    price_history = relationship(
        "CardPriceHistory",
        back_populates="card",
        order_by="desc(CardPriceHistory.recorded_at)",
        lazy="select",
        foreign_keys="[CardPriceHistory.card_id]"
    )

    _uuid_generator = UUIDGenerator()

    def __init__(self, **kwargs):
        if 'provider_name' not in kwargs:
            raise ValueError("provider_name is required")
        if 'provider_identifier' not in kwargs:
            raise ValueError("provider_identifier is required")
        if 'series_id' not in kwargs:
            raise ValueError("series_id is required")
        if 'card_set_id' not in kwargs:
            raise ValueError("card_set_id is required")
        if 'card_name' not in kwargs:
            raise ValueError("card_name is required")
        if 'card_number' not in kwargs:
            raise ValueError("card_number is required")
        if 'card_id' not in kwargs:
            name_for_uuid = f"{kwargs['card_name']}|{kwargs['provider_name']}|{kwargs['provider_identifier']}|{kwargs['series_id']}|{kwargs['card_set_id']}|{kwargs['card_number']}"
            kwargs['card_id'] = self._uuid_generator.generate(name_for_uuid)

        super().__init__(**kwargs)

    def to_dict(self):
        data = {
            'card_id': str(self.card_id),
            'provider_name': self.provider_name,
            'provider_identifier': self.provider_identifier,
            'series_id': str(self.series_id),
            'series_name': self.series.series_name if self.series else None,
            'card_set_id': str(self.card_set_id),
            'card_set_name': self.card_set.set_name if self.card_set else None,
            'card_name': self.card_name,
            'card_number': self.card_number,
            'card_rarity': self.card_rarity,
            'card_image_url': self.card_image_url,
            'types': self.types or [],
            'create_ts': self.create_ts.isoformat() if self.create_ts else None,
            'updated_ts': self.updated_ts.isoformat() if self.updated_ts else None,
        }

        if hasattr(self, 'latest_price') and self.latest_price:
            data['latest_price'] = self.latest_price.to_dict()

        return data

    def to_json(self):
        return json.dumps(self.to_dict())
