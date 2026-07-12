import os
from fastapi import Header, HTTPException
from jwt import PyJWKClient, decode as jwt_decode
from jwt.exceptions import PyJWTError

SUPABASE_URL = os.getenv("SUPABASE_URL")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

_jwks_client = PyJWKClient(JWKS_URL)


def obter_usuario_atual(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token ausente ou mal formatado")

    token = authorization.replace("Bearer ", "")

    try:
        chave_assinatura = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt_decode(
            token,
            chave_assinatura.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

    return payload["sub"]  # "sub" é o UUID do usuário dentro do token