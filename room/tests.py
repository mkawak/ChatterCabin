from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, TransactionTestCase, override_settings
from asgiref.sync import sync_to_async
from channels.testing import WebsocketCommunicator
from rest_framework.test import APIClient

from ChatterCabin.asgi import application
from .models import Room
from .views import tokens_for_user


class AuthenticationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="existing-user", password="StrongPassword123!"
        )
        Room.objects.create(name="General", slug="general")

    def login(self):
        response = self.client.post(
            "/api/login/",
            {"username": "existing-user", "password": "StrongPassword123!"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        return response.json()["token"]

    def test_login_token_can_read_rooms(self):
        tokens = self.login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = self.client.get("/api/rooms/")

        self.assertEqual(response.status_code, 200)
        self.assertIn(
            "general",
            [room["slug"] for room in response.json()["rooms"]],
        )

    def test_second_login_invalidates_first_access_token(self):
        first_tokens = self.login()
        self.login()
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {first_tokens['access']}"
        )

        response = self.client.get("/api/rooms/")
        self.assertEqual(response.status_code, 401)

    def test_refresh_uses_current_session(self):
        tokens = self.login()
        response = self.client.post(
            "/api/token/refresh/",
            {"refresh_token": tokens["refresh"]},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json())

    def test_logout_invalidates_access_and_refresh_tokens(self):
        tokens = self.login()
        response = self.client.post(
            "/api/logout/",
            {"refresh_token": tokens["refresh"]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        self.assertEqual(self.client.get("/api/rooms/").status_code, 401)

        self.client.credentials()
        response = self.client.post(
            "/api/token/refresh/",
            {"refresh_token": tokens["refresh"]},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_inactive_user_cannot_refresh(self):
        tokens = self.login()
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])

        response = self.client.post(
            "/api/token/refresh/",
            {"refresh_token": tokens["refresh"]},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_signup_validates_and_creates_user(self):
        response = self.client.post(
            "/api/signup/",
            {"username": "new-user", "password": "AnotherStrongPassword123!"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(get_user_model().objects.filter(username="new-user").exists())

    def test_spa_entry_point_is_served(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '<div id="root"></div>', html=True)


@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
)
class WebSocketTests(TransactionTestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="socket-user", password="StrongPassword123!"
        )
        Room.objects.create(name="General", slug="general")
        self.access_token = tokens_for_user(self.user)["access"]

    async def test_authenticated_user_can_join_and_send_message(self):
        communicator = WebsocketCommunicator(
            application,
            f"/ws/general/?token={self.access_token}",
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.send_json_to({"command": "room_joined", "room": "general"})
        joined = await communicator.receive_json_from()
        self.assertEqual(joined["type"], "user_joined")
        self.assertEqual(joined["username"], "socket-user")
        room_count = await sync_to_async(
            lambda: Room.objects.get(slug="general").user_count
        )()
        self.assertEqual(room_count, 1)

        await communicator.send_json_to({"command": "room_joined", "room": "general"})
        self.assertTrue(await communicator.receive_nothing(timeout=0.05))

        await communicator.send_json_to({"message": "Hello from the test"})
        message = await communicator.receive_json_from()
        self.assertEqual(message["type"], "message")
        self.assertEqual(message["username"], "socket-user")
        await communicator.disconnect()

        message_count = await sync_to_async(
            self.user.messages.filter(content="Hello from the test").count
        )()
        self.assertEqual(message_count, 1)
        room_count = await sync_to_async(
            lambda: Room.objects.get(slug="general").user_count
        )()
        self.assertEqual(room_count, 0)

    async def test_websocket_rejects_missing_token(self):
        communicator = WebsocketCommunicator(application, "/ws/general/")
        connected, close_code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(close_code, 4401)

    async def test_websocket_rejects_inactive_user(self):
        self.user.is_active = False
        await self.user.asave(update_fields=["is_active"])
        communicator = WebsocketCommunicator(
            application,
            f"/ws/general/?token={self.access_token}",
        )
        connected, close_code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(close_code, 4401)

    async def test_websocket_rejects_unknown_room(self):
        communicator = WebsocketCommunicator(
            application,
            f"/ws/unknown/?token={self.access_token}",
        )
        connected, close_code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(close_code, 4404)


class PresenceCommandTests(TestCase):
    def test_reset_room_counts_preserves_rooms(self):
        room = Room.objects.get(slug="Main")
        room.user_count = 5
        room.save(update_fields=["user_count"])

        call_command("reset_room_counts", stdout=StringIO())

        room.refresh_from_db()
        self.assertEqual(room.user_count, 0)
