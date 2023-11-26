export function enterGeneral() {
    let roomsChatSocket = null; // Unique reference for WebSocket in rooms.js
    function connectWebSocket() {

        const debug_val = JSON.parse(document.getElementById('json-debug_val').textContent);
        const wsProtocol = debug_val === "True" ? 'ws://' : 'wss://';
        const wsPreRooms = debug_val === "True" ? '/ws/' : '/wss/';

        roomsChatSocket = new WebSocket(wsProtocol + window.location.host + wsPreRooms + 'rooms/');

        roomsChatSocket.onopen = () => console.log('WebSocket connection established in Rooms.');
        roomsChatSocket.onmessage = handleWebSocketMessage;
        roomsChatSocket.onerror = (event) => console.error('WebSocket error in Rooms:', event);
        roomsChatSocket.onclose = disconnectWebSocket;

        attachEventListeners();
    }

    function handleWebSocketMessage(e) {
        const data = JSON.parse(e.data);
        // Existing message handling...

        if (data.type === 'user_count_updated') {
            updateRoomUserCount(data.room, data.user_count);
        }
    }

    function updateRoomUserCount(roomSlug, userCount) {
        const roomElement = document.querySelector(`#user-count-${roomSlug}`);
        if (roomElement) {
            roomElement.innerText = `Active users: ${userCount}`;
        }
    }

    function attachEventListeners() {
        const chatterCabinButton = document.getElementById('chatter_cabin');
        const roomsButton = document.getElementById('rooms_button');
        const logoutButton = document.getElementById('logout_button');

        attachButtonListener(chatterCabinButton, disconnectWebSocket);
        attachButtonListener(roomsButton, handleRoomsButtonClick);
        attachButtonListener(logoutButton, disconnectWebSocket);

        document.querySelectorAll('[data-room-slug]').forEach(button => {
            attachButtonListener(button, handleRoomSelection);
        });

    }

    function attachButtonListener(button, handler) {
        if (button) {
            button.addEventListener('click', handler);
            button.addEventListener('touchstart', handler);
        }
    }

    function handleRoomsButtonClick(event) {
        if (isCurrentPage('/rooms/')) {
            event.preventDefault();
            console.log('Already on the rooms page. No action needed.');
        } else {
            disconnectWebSocket();
        }
    }

    function isCurrentPage(path) {
        return window.location.pathname === path || window.location.pathname === `${path}/`;
    }

    function handleRoomSelection(event) {
        disconnectWebSocket();
        window.location.href = this.getAttribute('href');
    }

    function disconnectWebSocket() {
        if (roomsChatSocket && roomsChatSocket.readyState === WebSocket.OPEN) {
            roomsChatSocket.close();
            window.location.reload();
            roomsChatSocket = null;
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
