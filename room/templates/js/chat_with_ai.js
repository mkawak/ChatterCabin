export function enterChatGPT() {
    let enterPressed = false;
    const csrfToken = getCSRFToken();
    const messageInputDom = document.querySelector('#chat-message-input');
    const messageSubmit = document.querySelector('#chat-message-submit');

    function initializeChat() {
        if (messageInputDom) {
            messageInputDom.focus();
            messageInputDom.addEventListener('keydown', handleKeyDown);
            messageInputDom.addEventListener('keyup', handleKeyUp);
        }

        if (messageSubmit) {
            messageSubmit.addEventListener('click', handleSubmitClick);
        }

        loadSavedMessages();
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            enterPressed = true;
            e.preventDefault();
        }
    }

    function handleKeyUp(e) {
        if (e.key === 'Enter' && enterPressed) {
            sendMessageToChatGPT();
            enterPressed = false;
        }
    }

    function handleSubmitClick(e) {
        e.preventDefault();
        if (!enterPressed) {
            sendMessageToChatGPT();
        }
    }

    function sendMessageToChatGPT() {
        const message = messageInputDom.value.trim();

        if (!message) {
            alert('Please enter a message before sending.');
            return;
        }

        displayMessage('You', message);
        messageInputDom.value = '';

        fetchChatResponse(message);
    }

    function fetchChatResponse(message) {
        fetch('/rooms/chat_with_ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({'message': message})
        })
            .then(response => response.json())
            .then(data => {
                if (data.response) {
                    displayMessage('ChatGPT', data.response);
                    saveMessages();
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function displayMessage(sender, message) {
        const chatMessages = document.getElementById("chat-messages");
        const newMessage = document.createElement('div');
        newMessage.innerHTML = `<b class="text-black">${sender}</b>: <span class="text-gray-300">${message}</span>`;
        newMessage.style.opacity = 0;
        newMessage.style.transition = 'opacity 0.5s';
        chatMessages.appendChild(newMessage);

        setTimeout(() => {
            newMessage.style.opacity = 1;
            saveMessages();
            scrollToBottom();
        }, 100);
    }

    function saveMessages() {
        const chatMessages = document.getElementById("chat-messages").innerHTML;
        sessionStorage.setItem('chatMessages', chatMessages);
    }

    function loadSavedMessages() {
        const savedMessages = sessionStorage.getItem('chatMessages');
        if (savedMessages) {
            document.getElementById("chat-messages").innerHTML = savedMessages;
            scrollToBottom();
        }
    }

    function scrollToBottom() {
        const objDiv = document.getElementById("chat-messages");
        if (objDiv) {
            objDiv.scrollTop = objDiv.scrollHeight;
        }
    }

    function getCSRFToken() {
        const csrfTokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfTokenElement ? csrfTokenElement.value : '';
    }

    // Initialize chat functionalities
    initializeChat();
}
