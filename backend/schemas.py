from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime


class ItemBase(BaseModel):
    name: str = Field(..., max_length=400)
    store: str = Field(..., max_length=200)
    color: Optional[str] = Field(None, max_length=100)
    size: Optional[str] = Field(None, max_length=10)
    price: Decimal
    freight: Optional[Decimal] = None
    category: Optional[str] = Field(None, max_length=50)
    image_url: Optional[str] = Field(None, max_length=500)
    link: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = "quero_comprar"


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=400)
    store: Optional[str] = Field(None, max_length=200)
    color: Optional[str] = Field(None, max_length=100)
    size: Optional[str] = Field(None, max_length=10)
    price: Optional[Decimal] = None
    freight: Optional[Decimal] = None
    category: Optional[str] = Field(None, max_length=50)
    image_url: Optional[str] = Field(None, max_length=500)
    link: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = None


class ItemOut(ItemBase):
    id: int
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True