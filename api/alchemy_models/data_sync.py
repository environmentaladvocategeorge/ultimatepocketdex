import uuid
import json
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from alchemy_models import Base

class DataSync(Base):
    __tablename__ = 'DataSync'

    data_sync_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_name = Column(String(100), nullable=False, unique=True)
    last_synced_ts = Column(DateTime(timezone=True), nullable=False)
    create_ts = Column(DateTime(timezone=True), server_default=func.now())
    updated_ts = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __init__(self, **kwargs):
        if 'data_sync_id' not in kwargs:
            kwargs['data_sync_id'] = uuid.uuid4()
        if 'provider_name' not in kwargs:
            raise ValueError("provider_name is required")
        if 'last_synced_ts' not in kwargs:
            raise ValueError("last_synced_ts is required")

        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'data_sync_id': str(self.data_sync_id),
            'provider_name': self.provider_name,
            'last_synced_ts': self.last_synced_ts.isoformat() if self.last_synced_ts else None,
            'create_ts': self.create_ts.isoformat() if self.create_ts else None,
            'updated_ts': self.updated_ts.isoformat() if self.updated_ts else None,
        }

    def to_json(self):
        return json.dumps(self.to_dict())
