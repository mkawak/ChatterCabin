from django.urls import path, re_path
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import TemplateView

from . import views


spa_view = ensure_csrf_cookie(TemplateView.as_view(template_name="index.html"))

urlpatterns = [
    path("api/login/", views.login_view, name="login"),
    path("api/logout/", views.logout_view, name="logout"),
    path("api/signup/", views.signup_view, name="signup"),
    path("api/rooms/", views.get_rooms, name="rooms"),
    path("api/rooms/<slug:slug>/messages/", views.get_room_messages, name="room"),
    path("api/token/refresh/", views.refresh_token_view, name="token_refresh"),
    re_path(r"^(?!api/).*$", spa_view, name="spa"),
]
