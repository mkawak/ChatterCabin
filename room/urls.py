from django.urls import path
from . import views

urlpatterns = [
    path('chatgpt/', views.chatgpt_page, name='chatgpt_page'),
    path('chat_with_ai/', views.chat_with_ai, name='chat_with_ai'),
    path('', views.rooms, name='rooms'),
    path('<slug:slug>/', views.room, name='room'),
]
