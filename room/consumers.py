import json
from django.contrib.auth.models import User
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.db.models import F
from .models import Room, Message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, code):
        # Decrement the room user count
        if self.room_name != 'rooms':
            user_count = await self.decrement_room_user_count(self.room_name)

            # Broadcast the updated user count to the 'rooms' group
            await self.channel_layer.group_send(
                'chat_rooms',  # Assuming 'chat_rooms' is the group name for the 'rooms' group
                {
                    'type': 'broadcast_user_count',
                    'room': self.room_name,
                    'user_count': int(user_count),
                }
            )
            await self.channel_layer.group_send(
                self.room_group_name,  # Assuming 'chat_rooms' is the group name for the 'rooms' group
                {
                    'type': 'broadcast_user_left',
                    'user_count': int(user_count),
                }
            )

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        if 'message' in data:
            message = data['message']
            username = data['username']
            room = data['room']
            await self.save_message(username, room, message)
            # Send message to room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_message',
                    'message': message,
                    'username': username
                }
            )
        if 'command' in data:
            command = data['command']
            if command == 'room_joined':
                room_name = data['room']
                username = data['username']
                user_count = await self.increment_room_user_count(room_name)
                await self.channel_layer.group_send(
                    'chat_rooms',
                    {
                        'type': 'broadcast_user_count',
                        'room': room_name,
                        'user_count': int(user_count),
                    }
                )
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'broadcast_user_joined',
                        'username': username,
                        'user_count': int(user_count),
                    }
                )

    async def broadcast_user_joined(self, event):
        username = event['username']
        user_count = event['user_count']
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'username': username,
            'user_count': user_count,
        }))

    async def broadcast_user_left(self, event):
        user_count = event['user_count']
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user_count': user_count,
        }))

    # Receive message from room group
    async def broadcast_message(self, event):
        message = event['message']
        username = event['username']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'username': username
        }))

    async def broadcast_user_count(self, event):
        room = event['room']
        user_count = event['user_count']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user_count_updated',
            'room': room,
            'user_count': user_count
        }))

    @sync_to_async
    def save_message(self, username, room, message):
        user = User.objects.get(username=username)
        room = Room.objects.get(slug=room)
        Message.objects.create(user=user, room=room, content=message)

    @sync_to_async
    def increment_room_user_count(self, room_name):
        room = Room.objects.get(slug=room_name)
        room.user_count = F('user_count') + 1
        room.save()
        room.refresh_from_db(fields=['user_count'])
        return room.user_count

    @sync_to_async
    def decrement_room_user_count(self, room_name):
        room = Room.objects.get(slug=room_name)
        room.user_count = F('user_count') - 1
        room.save()
        room.refresh_from_db(fields=['user_count'])
        return room.user_count
