import uuid
import json
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from alchemy_models import Base
from utils.uuid_generator import UUIDGenerator

class UserCard(Base):
    __tablename__ = 'UserCard'
    __table_args__ = (
        UniqueConstraint('user_id', 'card_id', name='UserCard_unique_user_card'),
    )

    user_card_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('User.user_id', ondelete="CASCADE"), nullable=False)
    card_id = Column(UUID(as_uuid=True), ForeignKey('Card.card_id', ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    create_ts = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_ts = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="cards", lazy="joined")
    card = relationship("Card", back_populates="owners", lazy="joined")

    _uuid_generator = UUIDGenerator()

    def __init__(self, **kwargs):
        if 'user_id' not in kwargs:
            raise ValueError("user_id is required")
        if 'card_id' not in kwargs:
            raise ValueError("card_id is required")

        if 'user_card_id' not in kwargs:
            name_for_uuid = f"{kwargs['user_id']}|{kwargs['card_id']}"
            kwargs['user_card_id'] = self._uuid_generator.generate(name_for_uuid)

        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'user_card_id': str(self.user_card_id),
            'user_id': str(self.user_id),
            'card_id': str(self.card_id),
            'quantity': self.quantity,
            'create_ts': self.create_ts.isoformat() if self.create_ts else None,
            'updated_ts': self.updated_ts.isoformat() if self.updated_ts else None,
            'card': self.card.to_dict() if hasattr(self, 'card') and self.card else None,
        }

    def to_json(self):
        return json.dumps(self.to_dict())
