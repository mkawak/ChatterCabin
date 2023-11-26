from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from ChatterCabin import settings
from .models import Room, Message
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
import json
from openai import OpenAI


@login_required
def rooms(request):
    debug_val = " "
    if settings.DEBUG == True:
        debug_val = "True"
    else:
        debug_val = "False"

    rooms = Room.objects.all()
    return render(request, 'html/rooms.html', {'rooms': rooms, 'debug_val': debug_val})


@login_required
def room(request, slug):
    debug_val = " "
    if settings.DEBUG == True:
        debug_val = "True"
    else:
        debug_val = "False"

    room = Room.objects.get(slug=slug)
    last_ten_messages = Message.objects.filter(room=room).order_by('-date_added')[:25]
    messages = list(last_ten_messages)[::-1]
    return render(request, 'html/room.html', {'room': room, 'messages': messages, 'debug_val': debug_val})


@login_required
def chatgpt_page(request):
    return render(request, 'html/chatgpt.html')


# @login_required
@login_required
@require_http_methods(["POST"])
def chat_with_ai(request):
    return JsonResponse({'response': 'Feature is coming soon!'})
    # try:
    #     data = json.loads(request.body)
    #     user_message = data['message']
    #     client = OpenAI(
    #         # defaults to os.environ.get("OPENAI_API_KEY")
    #         api_key=settings.OPENAI_KEY,
    #     )
    #
    #     chat_completion = client.chat.completions.create(
    #         messages=[
    #             {
    #                 "role": "user",
    #                 "content": user_message,
    #             }
    #         ],
    #         model="gpt-3.5-turbo",
    #     )
    #     # Extracting the content of the response
    #     response_content = chat_completion.choices[0].message.content
    #
    #     return JsonResponse({'response': response_content})
    # except Exception as e:
    #     return JsonResponse({'error': str(e)}, status=500)
