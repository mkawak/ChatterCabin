from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Message, Room, UserSession


def tokens_for_user(user, rotate_session=True):
    session, _ = UserSession.objects.get_or_create(user=user)
    if rotate_session:
        session.rotate()

    refresh = RefreshToken.for_user(user)
    refresh["session_token"] = str(session.token)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


@api_view(["POST"])
def signup_view(request):
    username = str(request.data.get("username", "")).strip()
    password = request.data.get("password", "")

    if not username or not password:
        return Response(
            {"error": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_model = get_user_model()
    if user_model.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists. Please choose another."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    candidate = user_model(username=username)
    try:
        validate_password(password, user=candidate)
    except ValidationError as exc:
        return Response(
            {"error": " ".join(exc.messages)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        user = user_model.objects.create_user(username=username, password=password)
        tokens = tokens_for_user(user)

    login(request, user)
    return Response({"token": tokens}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def login_view(request):
    username = str(request.data.get("username", "")).strip()
    password = request.data.get("password", "")
    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response(
            {"error": "Invalid credentials."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    login(request, user)
    return Response({"token": tokens_for_user(user)}, status=status.HTTP_200_OK)


@api_view(["POST"])
def logout_view(request):
    raw_refresh = request.data.get("refresh_token")
    if not raw_refresh:
        return Response(
            {"error": "Refresh token not provided."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        refresh = RefreshToken(raw_refresh)
        user_id = refresh[api_settings.USER_ID_CLAIM]
        user = get_user_model().objects.get(
            **{api_settings.USER_ID_FIELD: user_id}
        )
        session = UserSession.objects.get(user=user)
        if str(session.token) != str(refresh.get("session_token", "")):
            raise TokenError("Session is no longer valid.")

        refresh.blacklist()
        session.rotate()
    except (TokenError, get_user_model().DoesNotExist, UserSession.DoesNotExist):
        return Response(
            {"error": "Refresh token is invalid or expired."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    logout(request)
    return Response({"message": "Logged out successfully."})


@api_view(["POST"])
def refresh_token_view(request):
    raw_refresh = request.data.get("refresh_token")
    if not raw_refresh:
        return Response(
            {"error": "Refresh token not provided."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        refresh = RefreshToken(raw_refresh)
        user_id = refresh[api_settings.USER_ID_CLAIM]
        user = get_user_model().objects.get(
            **{api_settings.USER_ID_FIELD: user_id}
        )
        if not user.is_active:
            raise TokenError("User is inactive.")

        session = UserSession.objects.get(user=user)
        if str(session.token) != str(refresh.get("session_token", "")):
            raise TokenError("Session is no longer valid.")
        return Response({"access": str(refresh.access_token)})
    except (TokenError, get_user_model().DoesNotExist, UserSession.DoesNotExist):
        return Response(
            {"error": "Refresh token is invalid or expired."},
            status=status.HTTP_401_UNAUTHORIZED,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_rooms(request):
    rooms = Room.objects.order_by("name").values("name", "slug", "user_count")
    return Response({"rooms": list(rooms)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_room_messages(request, slug):
    room = get_object_or_404(Room, slug=slug)
    newest_messages = list(
        Message.objects.filter(room=room)
        .select_related("user")
        .order_by("-date_added")[:25]
    )
    messages = [
        {
            "id": message.id,
            "message": message.content,
            "username": message.user.get_username(),
            "date_added": message.date_added.isoformat(),
        }
        for message in reversed(newest_messages)
    ]
    return Response(
        {
            "room": {
                "id": room.id,
                "name": room.name,
                "slug": room.slug,
                "user_count": room.user_count,
            },
            "messages": messages,
        }
    )
