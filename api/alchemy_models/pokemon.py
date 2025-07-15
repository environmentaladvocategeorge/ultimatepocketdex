import uuid
import json
from sqlalchemy import (
    Column, String, Integer, DateTime, UniqueConstraint, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from alchemy_models import Base
from utils.uuid_generator import UUIDGenerator

class Pokemon(Base):
    __tablename__ = 'Pokemon'
    __table_args__ = (
        UniqueConstraint('provider_name', 'provider_id', name='Pokemon_provider_unique'),
    )

    pokemon_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    national_dex_id = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    generation = Column(Integer, nullable=False)
    region = Column(String(50), nullable=False)
    types = Column(ARRAY(String(50)), default=list, nullable=False)

    sprite_url = Column(String(1024), nullable=True)
    provider_id = Column(String(255), nullable=False)
    provider_name = Column(String(100), nullable=False)

    create_ts = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_ts = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    _uuid_generator = UUIDGenerator()

    def __init__(self, **kwargs):
        required_fields = ['national_dex_id', 'name', 'generation', 'region', 'types', 'provider_id', 'provider_name']
        for field in required_fields:
            if field not in kwargs:
                raise ValueError(f"{field} is required")

        if 'pokemon_id' not in kwargs:
            name_for_uuid = f"{kwargs['name']}|{kwargs['national_dex_id']}|{kwargs['generation']}|{kwargs['region']}|{kwargs['provider_id']}|{kwargs['provider_name']}"
            kwargs['pokemon_id'] = self._uuid_generator.generate(name_for_uuid)

        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'pokemon_id': str(self.pokemon_id),
            'national_dex_id': self.national_dex_id,
            'name': self.name,
            'generation': self.generation,
            'region': self.region,
            'types': self.types or [],
            'sprite_url': self.sprite_url,
            'provider_id': self.provider_id,
            'provider_name': self.provider_name,
            'create_ts': self.create_ts.isoformat() if self.create_ts else None,
            'updated_ts': self.updated_ts.isoformat() if self.updated_ts else None,
        }

    def to_json(self):
        return json.dumps(self.to_dict())
