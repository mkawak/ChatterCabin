from django.urls import path
from . import consumers
from ChatterCabin import settings

if settings.DEBUG == True:
    websocket_urlpatterns = [
        path('ws/<str:room_name>/', consumers.ChatConsumer.as_asgi()),
    ]

else:
    websocket_urlpatterns = [
        path('wss/<str:room_name>/', consumers.ChatConsumer.as_asgi()),
    ]
