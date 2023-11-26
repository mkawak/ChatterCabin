export function enterChat() {
    let roomChatSocket = null; // Unique reference for WebSocket in room.js
    let enterPressed = false;

    function connectWebSocket() {

        const debug_val = JSON.parse(document.getElementById('json-debug_val').textContent);
        const roomName = JSON.parse(document.getElementById('json-roomname').textContent);
        const userName = JSON.parse(document.getElementById('json-username').textContent);

        const wsProtocol = debug_val === "True" ? 'ws://' : 'wss://';
        const wsPreRoom = debug_val === "True" ? '/ws/' : '/wss/';
        roomChatSocket = new WebSocket(wsProtocol + window.location.host + wsPreRoom + roomName + '/');

        roomChatSocket.onopen = () => sendRoomJoinCommand(roomName, userName);
        roomChatSocket.onmessage = handleWebSocketMessage;
        roomChatSocket.onerror = (event) => console.error('WebSocket error in ' + roomName + ':', event);
        roomChatSocket.onclose = disconnectWebSocket;

        attachEventListeners();
        attachInputEventListeners();
    }

    function handleWebSocketMessage(e) {
        const data = JSON.parse(e.data);
        if (data.message) {
            displayMessage(data.username, data.message);
        }
        if (data.type === 'user_joined') {
            displayUserJoinedPopup(data.username);
            updateUserCount(data.user_count)
        }
        if (data.type === 'user_left') {
            updateUserCount(data.user_count)
        }
    }

    function updateUserCount(userCount) {
        const userCountElement = document.getElementById('user-count');
        if (userCountElement) {
            userCountElement.innerText = `Users in room: ${userCount}`;
        }
    }

    function displayUserJoinedPopup(username) {
        const currentUserName = JSON.parse(document.getElementById('json-username').textContent);

        // Check if the joined user is not the current user
        if (username !== currentUserName) {
            // Show temporary notification
            showTemporaryNotification(username + " has joined the room.");
        }
    }

    function showTemporaryNotification(message) {
        // Create a new div element for the notification
        let notification = document.createElement("div");
        notification.className = "user-join-notification"; // Add a class for styling
        notification.innerText = message;

        // Append the notification to the body or a specific container
        document.body.appendChild(notification);

        // Remove the notification after 2 seconds
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    function sendRoomJoinCommand(roomName, userName) {
        roomChatSocket.send(JSON.stringify({
            'command': 'room_joined',
            'room': roomName,
            'username': userName,
        }));
        console.log('WebSocket connection established in ' + roomName + '.');
    }

    function displayMessage(username, message) {
        let newMessage = document.createElement('div');
        newMessage.innerHTML = `<b class="text-black">${username}</b>: <span class="text-gray-300">${message}</span>`;
        newMessage.style.opacity = 0;
        newMessage.style.transition = 'opacity 0.5s';
        document.querySelector('#chat-messages').appendChild(newMessage);

        // Animate the new message's appearance
        setTimeout(() => newMessage.style.opacity = 1, 100);

        scrollToBottom();
    }

    function scrollToBottom() {
        let objDiv = document.getElementById("chat-messages");
        objDiv.scrollTop = objDiv.scrollHeight;
    }

    function attachEventListeners() {
        const chatterCabinButton = document.getElementById('chatter_cabin');
        const roomsButton = document.getElementById('rooms_button');
        const logoutButton = document.getElementById('logout_button');

        attachButtonListener(chatterCabinButton, disconnectWebSocket);
        attachButtonListener(roomsButton, disconnectWebSocket);
        attachButtonListener(logoutButton, disconnectWebSocket);

    }

    function attachButtonListener(button, handler) {
        if (button) {
            button.addEventListener('click', handler);
            button.addEventListener('touchstart', handler);
        }
    }

    function attachInputEventListeners() {
        const inputElement = document.querySelector('#chat-message-input');
        const submitButton = document.querySelector('#chat-message-submit');

        if (inputElement) {
            inputElement.addEventListener('keydown', handleKeyDown);
            inputElement.addEventListener('keyup', handleKeyUp);
        }

        if (submitButton) {
            submitButton.addEventListener('click', sendMessage);
            submitButton.addEventListener('touchstart', sendMessage);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            enterPressed = true;
            e.preventDefault();
        }
    }

    function handleKeyUp(e) {
        if (e.key === 'Enter' && enterPressed) {
            sendMessage(e);
            enterPressed = false;
        }
    }

    function sendMessage(e) {
        if (e) e.preventDefault();
        const messageInputDom = document.querySelector('#chat-message-input');
        const message = messageInputDom.value;
        const userName = JSON.parse(document.getElementById('json-username').textContent);
        const roomName = JSON.parse(document.getElementById('json-roomname').textContent);

        if (message.trim() === '') {
            alert('Please enter a message before sending.');
        } else {
            roomChatSocket.send(JSON.stringify({
                'message': message,
                'username': userName,
                'room': roomName
            }));
            messageInputDom.value = ''; // Clear input field
        }
    }

    function disconnectWebSocket() {
        if (roomChatSocket && roomChatSocket.readyState === WebSocket.OPEN) {
            roomChatSocket.close();
            window.location.reload();
            roomChatSocket = null;
        }
    }

    window.addEventListener('beforeunload', disconnectWebSocket);

    window.addEventListener('pageshow', (event) => {
        // Check if the page is being accessed from the cache
        if (event.persisted) {
            // If true, reload the page
            window.location.reload();
        } else {
            // Otherwise, connect the WebSocket as usual
            connectWebSocket();
        }
    });

    window.addEventListener('pagehide', disconnectWebSocket);

}
