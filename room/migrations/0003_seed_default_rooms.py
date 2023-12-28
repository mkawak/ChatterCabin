from django.db import migrations


DEFAULT_ROOMS = (
    ("Main", "Main"),
    ("Hobbies", "Hobbies"),
    ("School", "School"),
)


def seed_default_rooms(apps, schema_editor):
    del schema_editor
    room_model = apps.get_model("room", "Room")
    for name, slug in DEFAULT_ROOMS:
        room_model.objects.get_or_create(
            slug=slug,
            defaults={"name": name, "user_count": 0},
        )


class Migration(migrations.Migration):
    dependencies = [("room", "0002_usersession")]

    operations = [migrations.RunPython(seed_default_rooms, migrations.RunPython.noop)]
