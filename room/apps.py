from django.apps import AppConfig

class RoomConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'room'

    def ready(self):
        # Make sure to wrap database operations in try-except block
        try:
            from room.models import Room
            Room.objects.update(user_count=0)
            print('User counts have been reset to 0 for all rooms.')

            from room.models import Message
            Message.objects.all().delete()  # This will delete all messages
            print('All messages have been deleted.')

        except Exception as e:
            # It's important to handle exceptions so that they don't prevent the app from starting
            print(f'Failed to reset user counts: {e}')