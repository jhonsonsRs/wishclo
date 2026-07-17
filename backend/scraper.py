import ipaddress
import json
import re
import socket
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}


class UrlInseguraError(Exception):
    """Levantado quando a URL não pode ser buscada por questões de segurança (SSRF)."""


def url_e_segura(url: str) -> bool:
    """
    Bloqueia URLs que não sejam http/https e que resolvam para IPs privados,
    loopback ou link-local (proteção contra SSRF: evita que o backend seja
    usado para acessar rede interna, localhost ou metadata endpoints de nuvem).
    """
    parsed = urlparse(url)

    if parsed.scheme not in ("http", "https"):
        return False

    if not parsed.hostname:
        return False

    try:
        # Resolve todos os IPs possíveis do hostname (cobre IPv4 e IPv6)
        enderecos = socket.getaddrinfo(parsed.hostname, None)
    except socket.gaierror:
        return False

    for *_, sockaddr in enderecos:
        ip_bruto = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_bruto)
        except ValueError:
            return False

        if (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_reserved
            or ip_obj.is_multicast
        ):
            return False

    return True


def _parse_preco_brl(valor_bruto: str) -> float | None:
    """
    Converte string de preço pra float, lidando tanto com formato
    internacional ("1299.90") quanto brasileiro ("1.299,90").
    """
    texto = valor_bruto.strip()

    if "," in texto and "." in texto:
        # Formato BR: ponto de milhar + vírgula decimal -> remove ponto, troca vírgula por ponto
        texto = texto.replace(".", "").replace(",", ".")
    elif "," in texto:
        # Só vírgula -> é o separador decimal
        texto = texto.replace(",", ".")
    # Se só tem ponto, já está no formato certo (ex: "1299.90")

    try:
        return float(texto)
    except ValueError:
        return None


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
                preco = _parse_preco_brl(str(oferta["price"]))
                if preco is not None:
                    return preco

    return None


def buscar_metadados(url: str) -> dict:
    if not url_e_segura(url):
        raise UrlInseguraError("Essa URL não pode ser acessada.")

    resposta = requests.get(url, headers=HEADERS, timeout=8, allow_redirects=True)
    resposta.raise_for_status()

    # Confere de novo depois dos redirects, já que o requests pode
    # ter sido levado pra outro host (ex: encurtador de link -> IP interno).
    if not url_e_segura(resposta.url):
        raise UrlInseguraError("Essa URL redirecionou para um destino não permitido.")

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
            preco = _parse_preco_brl(preco_bruto)

    return {
        "name": titulo,
        "image_url": imagem,
        "price": preco,
        "store": loja,
        "encontrado": bool(titulo or imagem or preco),
    }