from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
import requests

from database import get_db, engine, Base
import models
import schemas
from scraper import buscar_metadados

app = FastAPI(title="Wishclo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_USER_ID = 1


@app.on_event("startup")
def ensure_default_user():
    db = next(get_db())
    user = db.get(models.User, DEFAULT_USER_ID)
    if not user:
        user = models.User(
            id=DEFAULT_USER_ID,
            email="joao@wishclo.local",
            name="João",
            password_hash="temporario",
        )
        db.add(user)
        db.commit()
    db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/buscar-produto")
def buscar_produto(url: str):
    try:
        dados = buscar_metadados(url)
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=422, detail="Não foi possível acessar esse link")
    return dados


@app.post("/itens", response_model=schemas.ItemOut)
def criar_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    novo_item = models.Item(**item.model_dump(), user_id=DEFAULT_USER_ID)
    db.add(novo_item)
    db.commit()
    db.refresh(novo_item)
    return novo_item


@app.get("/itens", response_model=list[schemas.ItemOut])
def listar_itens(db: Session = Depends(get_db)):
    itens = db.query(models.Item).filter(models.Item.user_id == DEFAULT_USER_ID).all()
    return itens


@app.get("/itens/{item_id}", response_model=schemas.ItemOut)
def obter_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(models.Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return item


@app.put("/itens/{item_id}", response_model=schemas.ItemOut)
def editar_item(item_id: int, dados: schemas.ItemUpdate, db: Session = Depends(get_db)):
    item = db.get(models.Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(item, campo, valor)

    db.commit()
    db.refresh(item)
    return item


@app.delete("/itens/{item_id}")
def remover_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(models.Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    db.delete(item)
    db.commit()
    return {"ok": True}