import uuid
import json
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from alchemy_models import Base

class CardSet(Base):
    __tablename__ = 'CardSet'

    card_set_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ptcgio_id = Column(String(50), nullable=False, unique=True)
    set_name = Column(String(255), nullable=False)   

    series_id = Column(UUID(as_uuid=True), ForeignKey('CardSeries.series_id'), nullable=False)
    card_count = Column(Integer, nullable=True)
    logo_url = Column(String(1024), nullable=True)

    create_ts = Column(DateTime(timezone=True), server_default=func.now())
    updated_ts = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    series = relationship("CardSeries", back_populates="sets", lazy="joined")

    def __init__(self, **kwargs):
        if 'card_set_id' not in kwargs:
            kwargs['card_set_id'] = uuid.uuid4()
        if 'ptcgio_id' not in kwargs:
            raise ValueError("ptcgio_id is required")
        if 'set_name' not in kwargs:
            raise ValueError("set_name is required")
        if 'series_id' not in kwargs:
            raise ValueError("series_id is required")
        
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'card_set_id': str(self.card_set_id),
            'ptcgio_id': self.ptcgio_id,
            'set_name': self.set_name,
            'series_id': str(self.series_id),
            'card_count': self.card_count,
            'logo_url': self.logo_url,
            'create_ts': self.create_ts.isoformat() if self.create_ts else None,
            'updated_ts': self.updated_ts.isoformat() if self.updated_ts else None
        }

    def to_json(self):
        return json.dumps(self.to_dict())
