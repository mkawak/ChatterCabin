import React, {useEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {authenticatedFetch, websocketUrl} from '../components/Auth';
import '../App.css';

const Room = ({setIsAuthenticated, setUsername}) => {
    const {roomSlug} = useParams();
    const navigate = useNavigate();
    const [userCount, setUserCount] = useState(0);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const chatMessagesRef = useRef(null);
    const roomChatSocket = useRef(null);
    const notificationTimeoutRef = useRef(null);
    const [notification, setNotification] = useState('');
    const [showNotification, setShowNotification] = useState(false);
    const notificationRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const showTemporaryNotification = (message) => {
            setNotification(message);
            setShowNotification(true);

            if (notificationRef.current) {
                notificationRef.current.classList.remove('fade');
                void notificationRef.current.offsetWidth;
                notificationRef.current.classList.add('fade');
            }

            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
            }

            notificationTimeoutRef.current = setTimeout(() => {
                setNotification('');
                setShowNotification(false);
                notificationTimeoutRef.current = null;
            }, 2000);
        };

        const fetchRoomMessages = async () => {
            try {
                const response = await authenticatedFetch(
                    `/api/rooms/${roomSlug}/messages/`,
                    {},
                    navigate,
                    setIsAuthenticated,
                    setUsername
                );

                if (response.status === 404) {
                    navigate('/notfound', {replace: true});
                    return;
                }
                if (!response.ok) {
                    console.error('Error fetching room messages:', response.status);
                    return;
                }

                const data = await response.json();
                if (cancelled) return;
                setMessages(data.messages);
                setUserCount(data.room.user_count);

                const socket = new WebSocket(websocketUrl(roomSlug));
                roomChatSocket.current = socket;

                socket.onopen = () => {
                    socket.send(JSON.stringify({
                        command: 'room_joined',
                        room: roomSlug,
                    }));
                };

                socket.onmessage = (event) => {
                    const incoming = JSON.parse(event.data);
                    if (incoming.message) {
                        setMessages((currentMessages) => [
                            ...currentMessages,
                            {username: incoming.username, message: incoming.message},
                        ]);
                    }
                    if (incoming.type === 'user_joined') {
                        setUserCount(incoming.user_count);
                        if (incoming.username !== localStorage.getItem('username')) {
                            showTemporaryNotification(`${incoming.username} has joined the room.`);
                        }
                    }
                    if (incoming.type === 'user_count_update') {
                        setUserCount(incoming.user_count);
                    }
                    if (incoming.type === 'user_left') {
                        setUserCount(incoming.user_count);
                        if (incoming.username !== localStorage.getItem('username')) {
                            showTemporaryNotification(`${incoming.username} has left the room.`);
                        }
                    }
                };

                socket.onerror = (event) => console.error('WebSocket error:', event);
            } catch (error) {
                console.error('Error fetching room messages:', error);
            }
        };

        fetchRoomMessages();

        return () => {
            cancelled = true;
            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
            }
            if (roomChatSocket.current) {
                roomChatSocket.current.close();
                roomChatSocket.current = null;
            }
        };
    }, [navigate, roomSlug, setIsAuthenticated, setUsername]);

    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = (event) => {
        event.preventDefault();
        if (messageInput.trim() === '') {
            alert('Please enter a message before sending.');
            return;
        }
        if (roomChatSocket.current?.readyState !== WebSocket.OPEN) return;

        roomChatSocket.current.send(JSON.stringify({
            message: messageInput,
            username: localStorage.getItem('username'),
            room: roomSlug,
        }));
        setMessageInput('');
    };

    return (
        <div className="room-container">
            <h1 className="room-title">{roomSlug}</h1>
            <div className="user-count">Users in room: {userCount}</div>
            <div className="chat-container">
                <div className="chat-messages" ref={chatMessagesRef}>
                    {messages.map((message, index) => (
                        <div key={message.id || index} className="message">
                            <b className="username">{message.username}</b>:
                            <span className="message-content">{message.message}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="message-input-container">
                <form onSubmit={sendMessage} className="message-form">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(event) => setMessageInput(event.target.value)}
                        placeholder="Your message..."
                        className="message-input"
                    />
                    <button type="submit" className="message-submit">Submit</button>
                </form>
            </div>
            {showNotification && (
                <div className="user-notification fade" ref={notificationRef}>
                    {notification}
                </div>
            )}
        </div>
    );
};

export default Room;
