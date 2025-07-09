import uuid
import json
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from alchemy_models import Base

class CardSeries(Base):
    __tablename__ = 'CardSeries'

    series_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    series_name = Column(String(255), nullable=False)

    create_ts = Column(DateTime(timezone=True), server_default=func.now())
    updated_ts = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    sets = relationship("CardSet", back_populates="series", lazy="selectin")

    def __init__(self, **kwargs):
        if 'series_id' not in kwargs:
            kwargs['series_id'] = uuid.uuid4()
        if 'series_name' not in kwargs:
            raise ValueError("series_name is required")
        
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'series_id': str(self.series_id),
            'series_name': self.series_name,
            'create_ts': self.create_ts.isoformat() if self.create_ts else None,
            'updated_ts': self.updated_ts.isoformat() if self.updated_ts else None
        }

    def to_json(self):
        return json.dumps(self.to_dict())
