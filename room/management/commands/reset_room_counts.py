from django.core.management.base import BaseCommand

from room.models import Room


class Command(BaseCommand):
    help = "Reset persisted room presence counts before the chat server starts."

    def handle(self, *args, **options):
        del args, options
        updated = Room.objects.exclude(user_count=0).update(user_count=0)
        self.stdout.write(f"Reset presence counts for {updated} room(s).")
