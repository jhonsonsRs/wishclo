from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)

    items = relationship("Item", back_populates="user")

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(400), nullable=False)
    store = Column(String(200), nullable=False)
    color = Column(String(100))
    size = Column(String(10))
    price = Column(Numeric(10, 2), nullable=False)
    freight = Column(Numeric(10, 2))
    category = Column(String(50))
    image_url = Column(String(500))
    link = Column(String(500))
    status = Column(String(20), server_default="quero_comprar")
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="items")