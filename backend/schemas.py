from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class ItemBase(BaseModel):
    name: str
    store: str
    color: Optional[str] = None
    size: Optional[str] = None
    price: Decimal
    freight: Optional[Decimal] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    link: Optional[str] = None
    status: Optional[str] = "quero_comprar"


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    store: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    price: Optional[Decimal] = None
    freight: Optional[Decimal] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    link: Optional[str] = None
    status: Optional[str] = None


class ItemOut(ItemBase):
    id: int
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True