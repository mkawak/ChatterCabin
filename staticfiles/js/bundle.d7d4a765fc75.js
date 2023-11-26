/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./room/templates/js/chat_with_ai.js":
/*!*******************************************!*\
  !*** ./room/templates/js/chat_with_ai.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   enterChatGPT: () => (/* binding */ enterChatGPT)\n/* harmony export */ });\nfunction enterChatGPT() {\n    let enterPressed = false;\n    const csrfToken = getCSRFToken();\n    const messageInputDom = document.querySelector('#chat-message-input');\n    const messageSubmit = document.querySelector('#chat-message-submit');\n\n    function initializeChat() {\n        if (messageInputDom) {\n            messageInputDom.focus();\n            messageInputDom.addEventListener('keydown', handleKeyDown);\n            messageInputDom.addEventListener('keyup', handleKeyUp);\n        }\n\n        if (messageSubmit) {\n            messageSubmit.addEventListener('click', handleSubmitClick);\n        }\n\n        loadSavedMessages();\n    }\n\n    function handleKeyDown(e) {\n        if (e.key === 'Enter') {\n            enterPressed = true;\n            e.preventDefault();\n        }\n    }\n\n    function handleKeyUp(e) {\n        if (e.key === 'Enter' && enterPressed) {\n            sendMessageToChatGPT();\n            enterPressed = false;\n        }\n    }\n\n    function handleSubmitClick(e) {\n        e.preventDefault();\n        if (!enterPressed) {\n            sendMessageToChatGPT();\n        }\n    }\n\n    function sendMessageToChatGPT() {\n        const message = messageInputDom.value.trim();\n\n        if (!message) {\n            alert('Please enter a message before sending.');\n            return;\n        }\n\n        displayMessage('You', message);\n        messageInputDom.value = '';\n\n        fetchChatResponse(message);\n    }\n\n    function fetchChatResponse(message) {\n        fetch('/rooms/chat_with_ai/', {\n            method: 'POST',\n            headers: {\n                'Content-Type': 'application/json',\n                'X-CSRFToken': csrfToken\n            },\n            body: JSON.stringify({'message': message})\n        })\n            .then(response => response.json())\n            .then(data => {\n                if (data.response) {\n                    displayMessage('ChatGPT', data.response);\n                    saveMessages();\n                }\n            })\n            .catch(error => console.error('Error:', error));\n    }\n\n    function displayMessage(sender, message) {\n        const chatMessages = document.getElementById(\"chat-messages\");\n        const newMessage = document.createElement('div');\n        newMessage.innerHTML = `<b class=\"text-black\">${sender}</b>: <span class=\"text-gray-300\">${message}</span>`;\n        newMessage.style.opacity = 0;\n        newMessage.style.transition = 'opacity 0.5s';\n        chatMessages.appendChild(newMessage);\n\n        setTimeout(() => {\n            newMessage.style.opacity = 1;\n            saveMessages();\n            scrollToBottom();\n        }, 100);\n    }\n\n    function saveMessages() {\n        const chatMessages = document.getElementById(\"chat-messages\").innerHTML;\n        sessionStorage.setItem('chatMessages', chatMessages);\n    }\n\n    function loadSavedMessages() {\n        const savedMessages = sessionStorage.getItem('chatMessages');\n        if (savedMessages) {\n            document.getElementById(\"chat-messages\").innerHTML = savedMessages;\n            scrollToBottom();\n        }\n    }\n\n    function scrollToBottom() {\n        const objDiv = document.getElementById(\"chat-messages\");\n        if (objDiv) {\n            objDiv.scrollTop = objDiv.scrollHeight;\n        }\n    }\n\n    function getCSRFToken() {\n        const csrfTokenElement = document.querySelector('[name=csrfmiddlewaretoken]');\n        return csrfTokenElement ? csrfTokenElement.value : '';\n    }\n\n    // Initialize chat functionalities\n    initializeChat();\n}\n\n\n//# sourceURL=webpack:///./room/templates/js/chat_with_ai.js?");

/***/ }),

/***/ "./room/templates/js/room.js":
/*!***********************************!*\
  !*** ./room/templates/js/room.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   enterChat: () => (/* binding */ enterChat)\n/* harmony export */ });\nfunction enterChat() {\n    let roomChatSocket = null; // Unique reference for WebSocket in room.js\n    function connectWebSocket() {\n\n        const debug_val = JSON.parse(document.getElementById('json-debug_val').textContent);\n        const roomName = JSON.parse(document.getElementById('json-roomname').textContent);\n        const userName = JSON.parse(document.getElementById('json-username').textContent);\n\n        const wsProtocol = debug_val === \"True\" ? 'ws://' : 'wss://';\n        const wsPreRoom = debug_val === \"True\" ? '/ws/' : '/wss/';\n        roomChatSocket = new WebSocket(wsProtocol + window.location.host + wsPreRoom + roomName + '/');\n\n        roomChatSocket.onopen = () => sendRoomJoinCommand(roomName, userName);\n        roomChatSocket.onmessage = handleWebSocketMessage;\n        roomChatSocket.onerror = (event) => console.error('WebSocket error in ' + roomName + ':', event);\n        roomChatSocket.onclose = disconnectWebSocket;\n\n        attachEventListeners();\n        attachInputEventListeners();\n    }\n\n    function handleWebSocketMessage(e) {\n        const data = JSON.parse(e.data);\n        if (data.message) {\n            displayMessage(data.username, data.message);\n        }\n        if (data.type === 'user_joined') {\n            displayUserJoinedPopup(data.username);\n            updateUserCount(data.user_count)\n        }\n        if (data.type === 'user_left') {\n            updateUserCount(data.user_count)\n        }\n    }\n\n    function updateUserCount(userCount) {\n        const userCountElement = document.getElementById('user-count');\n        if (userCountElement) {\n            userCountElement.innerText = `Users in room: ${userCount}`;\n        }\n    }\n\n    function displayUserJoinedPopup(username) {\n        const currentUserName = JSON.parse(document.getElementById('json-username').textContent);\n\n        // Check if the joined user is not the current user\n        if (username !== currentUserName) {\n            // Show temporary notification\n            showTemporaryNotification(username + \" has joined the room.\");\n        }\n    }\n\n    function showTemporaryNotification(message) {\n        // Create a new div element for the notification\n        let notification = document.createElement(\"div\");\n        notification.className = \"user-join-notification\"; // Add a class for styling\n        notification.innerText = message;\n\n        // Append the notification to the body or a specific container\n        document.body.appendChild(notification);\n\n        // Remove the notification after 2 seconds\n        setTimeout(() => {\n            notification.remove();\n        }, 4000);\n    }\n\n    function sendRoomJoinCommand(roomName, userName) {\n        roomChatSocket.send(JSON.stringify({\n            'command': 'room_joined',\n            'room': roomName,\n            'username': userName,\n        }));\n        console.log('WebSocket connection established in ' + roomName + '.');\n    }\n\n    function displayMessage(username, message) {\n        let newMessage = document.createElement('div');\n        newMessage.innerHTML = `<b class=\"text-black\">${username}</b>: <span class=\"text-gray-300\">${message}</span>`;\n        newMessage.style.opacity = 0;\n        newMessage.style.transition = 'opacity 0.5s';\n        document.querySelector('#chat-messages').appendChild(newMessage);\n\n        // Animate the new message's appearance\n        setTimeout(() => newMessage.style.opacity = 1, 100);\n\n        scrollToBottom();\n    }\n\n    function scrollToBottom() {\n        let objDiv = document.getElementById(\"chat-messages\");\n        objDiv.scrollTop = objDiv.scrollHeight;\n    }\n\n    function attachEventListeners() {\n        const chatterCabinButton = document.getElementById('chatter_cabin');\n        const roomsButton = document.getElementById('rooms_button');\n        const logoutButton = document.getElementById('logout_button');\n\n        attachButtonListener(chatterCabinButton, disconnectWebSocket);\n        attachButtonListener(roomsButton, disconnectWebSocket);\n        attachButtonListener(logoutButton, disconnectWebSocket);\n\n    }\n\n    function attachButtonListener(button, handler) {\n        if (button) {\n            button.addEventListener('click', handler);\n            button.addEventListener('touchstart', handler);\n        }\n    }\n\n    function attachInputEventListeners() {\n        let enterPressed = false;\n        const inputElement = document.querySelector('#chat-message-input');\n        const submitButton = document.querySelector('#chat-message-submit');\n\n        if (inputElement) {\n            inputElement.addEventListener('keydown', handleEnterKey);\n        }\n\n        if (submitButton) {\n            submitButton.addEventListener('click', sendMessage);\n            submitButton.addEventListener('touchstart', sendMessage);\n        }\n    }\n\n    function handleEnterKey(e) {\n        if (e.key === 'Enter') {\n            e.preventDefault();\n            sendMessage();\n        }\n    }\n\n    function sendMessage() {\n        const messageInputDom = document.querySelector('#chat-message-input');\n        const message = messageInputDom.value;\n        const userName = JSON.parse(document.getElementById('json-username').textContent);\n        const roomName = JSON.parse(document.getElementById('json-roomname').textContent);\n\n        if (message.trim() === '') {\n            alert('Please enter a message before sending.');\n        } else {\n            roomChatSocket.send(JSON.stringify({\n                'message': message,\n                'username': userName,\n                'room': roomName\n            }));\n            messageInputDom.value = ''; // Clear input field\n        }\n    }\n\n    function disconnectWebSocket() {\n        if (roomChatSocket && roomChatSocket.readyState === WebSocket.OPEN) {\n            roomChatSocket.close();\n            window.location.reload();\n            roomChatSocket = null;\n        }\n    }\n\n    window.addEventListener('beforeunload', disconnectWebSocket);\n\n    window.addEventListener('pageshow', connectWebSocket);\n\n    window.addEventListener('pagehide', disconnectWebSocket);\n\n}\n\n\n//# sourceURL=webpack:///./room/templates/js/room.js?");

/***/ }),

/***/ "./room/templates/js/rooms.js":
/*!************************************!*\
  !*** ./room/templates/js/rooms.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   enterGeneral: () => (/* binding */ enterGeneral)\n/* harmony export */ });\nfunction enterGeneral() {\n    let roomsChatSocket = null; // Unique reference for WebSocket in rooms.js\n    function connectWebSocket() {\n\n        const debug_val = JSON.parse(document.getElementById('json-debug_val').textContent);\n        const wsProtocol = debug_val === \"True\" ? 'ws://' : 'wss://';\n        const wsPreRooms = debug_val === \"True\" ? '/ws/' : '/wss/';\n\n        roomsChatSocket = new WebSocket(wsProtocol + window.location.host + wsPreRooms + 'rooms/');\n\n        roomsChatSocket.onopen = () => console.log('WebSocket connection established in Rooms.');\n        roomsChatSocket.onmessage = handleWebSocketMessage;\n        roomsChatSocket.onerror = (event) => console.error('WebSocket error in Rooms:', event);\n        roomsChatSocket.onclose = disconnectWebSocket;\n\n        attachEventListeners();\n    }\n\n    function handleWebSocketMessage(e) {\n        const data = JSON.parse(e.data);\n        // Existing message handling...\n\n        if (data.type === 'user_count_updated') {\n            updateRoomUserCount(data.room, data.user_count);\n        }\n    }\n\n    function updateRoomUserCount(roomSlug, userCount) {\n        const roomElement = document.querySelector(`#user-count-${roomSlug}`);\n        if (roomElement) {\n            roomElement.innerText = `Active users: ${userCount}`;\n        }\n    }\n\n    function attachEventListeners() {\n        const chatterCabinButton = document.getElementById('chatter_cabin');\n        const roomsButton = document.getElementById('rooms_button');\n        const logoutButton = document.getElementById('logout_button');\n\n        attachButtonListener(chatterCabinButton, disconnectWebSocket);\n        attachButtonListener(roomsButton, handleRoomsButtonClick);\n        attachButtonListener(logoutButton, disconnectWebSocket);\n\n        document.querySelectorAll('[data-room-slug]').forEach(button => {\n            attachButtonListener(button, handleRoomSelection);\n        });\n\n    }\n\n    function attachButtonListener(button, handler) {\n        if (button) {\n            button.addEventListener('click', handler);\n            button.addEventListener('touchstart', handler);\n        }\n    }\n\n    function handleRoomsButtonClick(event) {\n        if (isCurrentPage('/rooms/')) {\n            event.preventDefault();\n            console.log('Already on the rooms page. No action needed.');\n        } else {\n            disconnectWebSocket();\n        }\n    }\n\n    function isCurrentPage(path) {\n        return window.location.pathname === path || window.location.pathname === `${path}/`;\n    }\n\n    function handleRoomSelection(event) {\n        disconnectWebSocket();\n        window.location.href = this.getAttribute('href');\n    }\n\n    function disconnectWebSocket() {\n        if (roomsChatSocket && roomsChatSocket.readyState === WebSocket.OPEN) {\n            roomsChatSocket.close();\n            window.location.reload();\n            roomsChatSocket = null;\n        }\n    }\n\n    window.addEventListener('beforeunload', disconnectWebSocket);\n\n    window.addEventListener('pageshow', connectWebSocket);\n\n    window.addEventListener('pagehide', disconnectWebSocket);\n\n\n}\n\n\n//# sourceURL=webpack:///./room/templates/js/rooms.js?");

/***/ }),

/***/ "./static/js/index.js":
/*!****************************!*\
  !*** ./static/js/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _room_templates_js_rooms__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../room/templates/js/rooms */ \"./room/templates/js/rooms.js\");\n/* harmony import */ var _room_templates_js_room__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../room/templates/js/room */ \"./room/templates/js/room.js\");\n/* harmony import */ var _room_templates_js_chat_with_ai__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../room/templates/js/chat_with_ai */ \"./room/templates/js/chat_with_ai.js\");\n\n\n\n\nwindow.enterGeneral = _room_templates_js_rooms__WEBPACK_IMPORTED_MODULE_0__.enterGeneral;\nwindow.enterChat = _room_templates_js_room__WEBPACK_IMPORTED_MODULE_1__.enterChat;\nwindow.enterChatGPT = _room_templates_js_chat_with_ai__WEBPACK_IMPORTED_MODULE_2__.enterChatGPT;\n\n//# sourceURL=webpack:///./static/js/index.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./static/js/index.js");
/******/ 	
/******/ })()
;