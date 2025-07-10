from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

from .card_set import CardSet
from .card_series import CardSeries

__all__ = ["CardSet", "CardSeries"]