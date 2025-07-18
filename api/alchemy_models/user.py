import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import json
from alchemy_models import Base

class User(Base):
    __tablename__ = 'User'
    
    user_id = Column(UUID(as_uuid=True), primary_key=True)
    user_name = Column(String(255), nullable=False)
    email_address = Column(String(255), nullable=False)
    create_ts = Column(DateTime(timezone=True), server_default=func.now())
    updated_ts = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __init__(self, **kwargs):
        if 'user_id' not in kwargs:
            kwargs['user_id'] = uuid.uuid4()
        if 'user_name' not in kwargs:
            raise ValueError("user_name is required")
        if 'email_address' not in kwargs:
            raise ValueError("email_address is required")
        
        super().__init__(**kwargs)
    
    def to_dict(self):
        """Converts the model to a dictionary."""
        return {
            'user_id': str(self.user_id),
            'user_name': self.user_name,
            'email_address': self.email_address,
            'create_ts': self.create_ts.isoformat() if self.create_ts else None,
            'updated_ts': self.updated_ts.isoformat() if self.updated_ts else None
        }
    
    def to_json(self):
        """Converts the model to a JSON string."""
        return json.dumps(self.to_dict())