import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.db import transaction

from .models import Message, Room


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"
        self.joined_room = False

        if self.room_name != "home" and not await self.room_exists(self.room_name):
            await self.close(code=4404)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if getattr(self, "joined_room", False):
            user_count = await self.decrement_room_user_count(self.room_name)
            await self.channel_layer.group_send(
                "chat_home",
                {
                    "type": "broadcast_user_count",
                    "room": self.room_name,
                    "user_count": user_count,
                },
            )
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_user_left",
                    "username": self.scope["user"].get_username(),
                    "user_count": user_count,
                },
            )

        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.close(code=4400)
            return

        if "message" in data and self.room_name != "home":
            message = str(data["message"]).strip()
            if not message:
                return
            message = message[:4000]
            username = self.scope["user"].get_username()
            await self.save_message(self.scope["user"].pk, self.room_name, message)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_message",
                    "message": message,
                    "username": username,
                },
            )

        if data.get("command") == "room_joined" and not self.joined_room:
            if data.get("room") != self.room_name or self.room_name == "home":
                return

            self.joined_room = True
            user_count = await self.increment_room_user_count(self.room_name)
            username = self.scope["user"].get_username()
            await self.channel_layer.group_send(
                "chat_home",
                {
                    "type": "broadcast_user_count",
                    "room": self.room_name,
                    "user_count": user_count,
                },
            )
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "broadcast_user_joined",
                    "username": username,
                    "user_count": user_count,
                },
            )

    async def broadcast_user_joined(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "user_joined",
                    "username": event["username"],
                    "user_count": event["user_count"],
                }
            )
        )

    async def broadcast_user_left(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "user_left",
                    "username": event["username"],
                    "user_count": event["user_count"],
                }
            )
        )

    async def broadcast_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "message",
                    "message": event["message"],
                    "username": event["username"],
                }
            )
        )

    async def broadcast_user_count(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "user_count_updated",
                    "room": event["room"],
                    "user_count": event["user_count"],
                }
            )
        )

    @database_sync_to_async
    def room_exists(self, room_name):
        return Room.objects.filter(slug=room_name).exists()

    @database_sync_to_async
    def save_message(self, user_id, room_name, message):
        room = Room.objects.get(slug=room_name)
        Message.objects.create(user_id=user_id, room=room, content=message)

    @database_sync_to_async
    def increment_room_user_count(self, room_name):
        with transaction.atomic():
            room = Room.objects.select_for_update().get(slug=room_name)
            room.user_count += 1
            room.save(update_fields=["user_count"])
            return room.user_count

    @database_sync_to_async
    def decrement_room_user_count(self, room_name):
        with transaction.atomic():
            room = Room.objects.select_for_update().get(slug=room_name)
            room.user_count = max(0, room.user_count - 1)
            room.save(update_fields=["user_count"])
            return room.user_count
