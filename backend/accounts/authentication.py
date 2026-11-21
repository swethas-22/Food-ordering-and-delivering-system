import hmac
import hashlib
import base64
import json
import time
from datetime import datetime, timedelta, timezone
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
from .models import User, BlacklistedToken

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4)) if len(data) % 4 != 0 else ''
    return base64.urlsafe_b64decode(data + padding)

def create_jwt(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(settings.SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    sig_b64 = _base64url_encode(signature)
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_jwt(token: str) -> dict:
    parts = token.split('.')
    if len(parts) != 3:
        raise AuthenticationFailed('Invalid token format')
    header_b64, payload_b64, sig_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    expected_sig = hmac.new(settings.SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    if not hmac.compare_digest(_base64url_decode(sig_b64), expected_sig):
        raise AuthenticationFailed('Invalid token signature')
    try:
        payload = json.loads(_base64url_decode(payload_b64).decode('utf-8'))
    except Exception:
        raise AuthenticationFailed('Invalid token payload')
    now = int(time.time())
    if payload.get('exp', 0) < now:
        raise AuthenticationFailed('Token has expired')
    return payload

def generate_tokens(user: User) -> dict:
    now = int(time.time())
    # Access token expires in 15 mins (NFR-S2)
    access_exp = now + (15 * 60)
    # Refresh token expires in 7 days (NFR-S2)
    refresh_exp = now + (7 * 24 * 3600)

    access_payload = {
        'user_id': user.id,
        'email': user.email,
        'token_type': 'access',
        'exp': access_exp,
        'iat': now,
    }
    refresh_payload = {
        'user_id': user.id,
        'token_type': 'refresh',
        'exp': refresh_exp,
        'iat': now,
    }
    return {
        'access': create_jwt(access_payload),
        'refresh': create_jwt(refresh_payload),
    }

def blacklist_token(token: str):
    BlacklistedToken.objects.get_or_create(token=token)

def rotate_refresh_token(refresh_token: str) -> dict:
    if BlacklistedToken.objects.filter(token=refresh_token).exists():
        raise AuthenticationFailed('Refresh token has been revoked')
    payload = decode_jwt(refresh_token)
    if payload.get('token_type') != 'refresh':
        raise AuthenticationFailed('Invalid token type for refresh')
    try:
        user = User.objects.get(id=payload.get('user_id'), is_active=True)
    except User.DoesNotExist:
        raise AuthenticationFailed('User not found or inactive')
    
    # Blacklist old refresh token
    blacklist_token(refresh_token)
    return generate_tokens(user)


class JWTAuthentication(BaseAuthentication):
    def authenticate_header(self, request):
        return 'Bearer realm="api"'

    def authenticate(self, request):
        auth_header = get_authorization_header(request).split()
        if not auth_header:
            return None
        if auth_header[0].lower() != b'bearer':
            return None
        if len(auth_header) != 2:
            return None
        
        try:
            token = auth_header[1].decode('utf-8')
            payload = decode_jwt(token)
        except Exception:
            return None

        if payload.get('token_type') != 'access':
            return None

        user_id = payload.get('user_id')
        try:
            user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return None

        return (user, token)
