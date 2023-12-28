"""ASGI entry point for HTTP and authenticated WebSocket traffic."""

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ChatterCabin.settings")

import django

django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

from room.middleware import WebSocketJWTAuthMiddleware
from room.routing import websocket_urlpatterns


application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": WebSocketJWTAuthMiddleware(URLRouter(websocket_urlpatterns)),
    }
)
