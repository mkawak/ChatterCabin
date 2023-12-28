from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import UserSession


class SessionJWTAuthentication(JWTAuthentication):
    """JWT authentication that also enforces the user's current login session."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        session_token = validated_token.get("session_token")

        try:
            current_token = str(user.chattercabin_session.token)
        except UserSession.DoesNotExist as exc:
            raise AuthenticationFailed("Session is no longer valid.") from exc

        if not session_token or current_token != str(session_token):
            raise AuthenticationFailed("Session is no longer valid.")

        return user
