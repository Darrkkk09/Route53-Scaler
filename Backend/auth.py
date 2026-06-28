import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter()

# In‑memory users store (username: password)
_USERS = {
    "admin": "adminpass",
    "user": "userpass",
}

# In‑memory token store (token: username)
_TOKENS: dict[str, str] = {}

security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    token = credentials.credentials
    username = _TOKENS.get(token)
    if username is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return username

@router.post("/login")
def login(data: dict):
    # Expected keys: username, password
    username = data.get("username")
    password = data.get("password")
    if username not in _USERS or _USERS[username] != password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = str(uuid.uuid4())
    _TOKENS[token] = username
    return {"access_token": token, "token_type": "bearer"}

@router.post("/logout")
def logout(token: str = Depends(security)):
    # Token is extracted via HTTPBearer scheme
    token_str = token.credentials
    if token_str in _TOKENS:
        del _TOKENS[token_str]
    return {"msg": "Logged out"}
