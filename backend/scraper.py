import json
import re
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}


def extrair_nome_loja(url: str) -> str | None:
    dominio = urlparse(url).netloc 
    dominio = dominio.replace("www.", "")
    partes = dominio.split(".")
    if not partes or not partes[0]:
        return None
    return partes[0].capitalize()  


def extrair_preco_via_json_ld(soup: BeautifulSoup) -> float | None:
    tags = soup.find_all("script", type="application/ld+json")

    for tag in tags:
        try:
            dados = json.loads(tag.string or "")
        except (json.JSONDecodeError, TypeError):
            continue

        candidatos = dados if isinstance(dados, list) else [dados]

        for item in candidatos:
            if not isinstance(item, dict):
                continue

            oferta = item.get("offers")
            if isinstance(oferta, list):
                oferta = oferta[0] if oferta else None

            if isinstance(oferta, dict) and oferta.get("price"):
                try:
                    return float(str(oferta["price"]).replace(",", "."))
                except ValueError:
                    continue

    return None


def buscar_metadados(url: str) -> dict:
    resposta = requests.get(url, headers=HEADERS, timeout=8)
    resposta.raise_for_status()

    soup = BeautifulSoup(resposta.text, "html.parser")

    def pegar_meta(propriedade: str) -> str | None:
        tag = soup.find("meta", property=propriedade)
        if tag and tag.get("content"):
            return tag["content"]
        return None

    titulo = pegar_meta("og:title")
    imagem = pegar_meta("og:image")
    loja = extrair_nome_loja(url)

    preco = extrair_preco_via_json_ld(soup)

    if preco is None:
        preco_bruto = pegar_meta("product:price:amount") or pegar_meta("og:price:amount")
        if preco_bruto:
            try:
                preco = float(preco_bruto.replace(",", "."))
            except ValueError:
                preco = None

    return {
        "name": titulo,
        "image_url": imagem,
        "price": preco,
        "store": loja,
        "encontrado": bool(titulo or imagem or preco),
    }