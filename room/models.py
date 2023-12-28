import uuid

from django.conf import settings
from django.db import models


class Room(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    user_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name[:50]


class Message(models.Model):
    room = models.ForeignKey(Room, related_name="messages", on_delete=models.CASCADE)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="messages",
        on_delete=models.CASCADE,
    )
    content = models.TextField()
    date_added = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username[:50]}: {self.content[:50]}"

    class Meta:
        ordering = ("date_added",)


class UserSession(models.Model):
    """Tracks the currently valid JWT session for each Django user."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="chattercabin_session",
        on_delete=models.CASCADE,
    )
    token = models.UUIDField(default=uuid.uuid4, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    def rotate(self):
        self.token = uuid.uuid4()
        self.save(update_fields=["token", "updated_at"])
        return self.token

    def __str__(self):
        return f"Session for {self.user.get_username()}"
