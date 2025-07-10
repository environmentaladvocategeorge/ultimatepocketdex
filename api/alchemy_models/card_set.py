import uuid
import json
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from alchemy_models import Base

class CardSet(Base):
    __tablename__ = 'CardSet'
    __table_args__ = (
        UniqueConstraint('provider_name', 'provider_identifier', name='CardSet_provider_unique'),
    )

    card_set_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    set_name = Column(String(255), nullable=False, unique=True)

    provider_name = Column(String(100), nullable=False)
    provider_identifier = Column(String(255), nullable=False)

    series_id = Column(UUID(as_uuid=True), ForeignKey('CardSeries.series_id'), nullable=False)
    set_card_count = Column(Integer, nullable=True)
    set_release_date = Column(DateTime(timezone=True), nullable=True)
    set_logo_url = Column(String(1024), nullable=True)

    create_ts = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_ts = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    series = relationship("CardSeries", back_populates="sets", lazy="joined")

    def __init__(self, **kwargs):
        if 'card_set_id' not in kwargs:
            kwargs['card_set_id'] = uuid.uuid4()
        if 'provider_name' not in kwargs:
            raise ValueError("provider_name is required")
        if 'provider_identifier' not in kwargs:
            raise ValueError("provider_identifier is required")
        if 'set_name' not in kwargs:
            raise ValueError("set_name is required")
        if 'series_id' not in kwargs:
            raise ValueError("series_id is required")
        
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'card_set_id': str(self.card_set_id),
            'set_name': self.set_name,
            'provider_name': self.provider_name,
            'provider_identifier': self.provider_identifier,
            'series_id': str(self.series_id),
            'series_name': self.series.series_name if self.series else None,
            'set_card_count': self.set_card_count,
            'set_release_date': self.set_release_date.isoformat() if self.set_release_date else None,
            'set_logo_url': self.set_logo_url,
            'create_ts': self.create_ts.isoformat() if self.create_ts else None,
            'updated_ts': self.updated_ts.isoformat() if self.updated_ts else None
        }
    
    def to_json(self):
        return json.dumps(self.to_dict())
