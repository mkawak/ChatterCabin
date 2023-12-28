from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import AccessToken

from .models import UserSession


@database_sync_to_async
def user_from_access_token(raw_token):
    token = AccessToken(raw_token)
    user_id = token[api_settings.USER_ID_CLAIM]
    user = get_user_model().objects.get(**{api_settings.USER_ID_FIELD: user_id})
    if not user.is_active:
        raise TokenError("User is inactive.")

    session = UserSession.objects.get(user=user)

    if str(session.token) != str(token.get("session_token", "")):
        raise TokenError("Session is no longer valid.")

    return user


class WebSocketJWTAuthMiddleware:
    """Authenticate WebSockets with the access token in the query string."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        params = parse_qs(scope.get("query_string", b"").decode("utf-8"))
        raw_token = params.get("token", [None])[0]

        if not raw_token:
            await send({"type": "websocket.close", "code": 4401})
            return

        try:
            scope["user"] = await user_from_access_token(raw_token)
        except Exception:
            await send({"type": "websocket.close", "code": 4401})
            return

        return await self.inner(scope, receive, send)
