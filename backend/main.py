from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import requests

from database import get_db, engine, Base
import models
import schemas
from scraper import buscar_metadados, UrlInseguraError
from auth import obter_usuario_atual

app = FastAPI(title="Wishclo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://wishclo.vercel.app",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.on_event("startup")
def criar_tabelas_se_nao_existirem():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/buscar-produto")
def buscar_produto(url: str, usuario_id: str = Depends(obter_usuario_atual)):
    try:
        dados = buscar_metadados(url)
    except UrlInseguraError:
        raise HTTPException(status_code=400, detail="Essa URL não é permitida")
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=422, detail="Não foi possível acessar esse link")
    return dados


@app.post("/itens", response_model=schemas.ItemOut)
def criar_item(
    item: schemas.ItemCreate,
    db: Session = Depends(get_db),
    usuario_id: str = Depends(obter_usuario_atual),
):
    novo_item = models.Item(**item.model_dump(), user_id=usuario_id)
    db.add(novo_item)
    db.commit()
    db.refresh(novo_item)
    return novo_item


@app.get("/itens", response_model=list[schemas.ItemOut])
def listar_itens(
    db: Session = Depends(get_db),
    usuario_id: str = Depends(obter_usuario_atual),
):
    itens = db.query(models.Item).filter(models.Item.user_id == usuario_id).all()
    return itens


@app.get("/itens/{item_id}", response_model=schemas.ItemOut)
def obter_item(
    item_id: int,
    db: Session = Depends(get_db),
    usuario_id: str = Depends(obter_usuario_atual),
):
    item = db.get(models.Item, item_id)
    if not item or item.user_id != usuario_id:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return item


@app.put("/itens/{item_id}", response_model=schemas.ItemOut)
def editar_item(
    item_id: int,
    dados: schemas.ItemUpdate,
    db: Session = Depends(get_db),
    usuario_id: str = Depends(obter_usuario_atual),
):
    item = db.get(models.Item, item_id)
    if not item or item.user_id != usuario_id:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(item, campo, valor)

    db.commit()
    db.refresh(item)
    return item


@app.delete("/itens/{item_id}")
def remover_item(
    item_id: int,
    db: Session = Depends(get_db),
    usuario_id: str = Depends(obter_usuario_atual),
):
    item = db.get(models.Item, item_id)
    if not item or item.user_id != usuario_id:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    db.delete(item)
    db.commit()
    return {"ok": True}