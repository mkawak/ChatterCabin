import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {authenticatedFetch, websocketUrl} from '../components/Auth';
import '../App.css';

const Home = ({setAvailableRooms, setIsAuthenticated, setUsername}) => {
    const [rooms, setRooms] = useState([]);
    const homeWebSocket = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        const fetchRooms = async () => {
            try {
                const response = await authenticatedFetch(
                    '/api/rooms/',
                    {},
                    navigate,
                    setIsAuthenticated,
                    setUsername
                );

                if (!response.ok) {
                    console.error('Error fetching rooms:', response.status);
                    return;
                }

                const data = await response.json();
                if (cancelled) return;
                setRooms(data.rooms);
                const roomSlugs = data.rooms.map((room) => room.slug);
                setAvailableRooms(roomSlugs);
                localStorage.setItem('availableRooms', JSON.stringify(roomSlugs));

                homeWebSocket.current = new WebSocket(websocketUrl('home'));
                homeWebSocket.current.onmessage = (event) => {
                    const message = JSON.parse(event.data);
                    if (message.type === 'user_count_updated') {
                        setRooms((currentRooms) =>
                            currentRooms.map((room) =>
                                room.slug === message.room
                                    ? {...room, user_count: message.user_count}
                                    : room
                            )
                        );
                    }
                };
                homeWebSocket.current.onerror = (event) => {
                    console.error('WebSocket error in Home:', event);
                };
            } catch (error) {
                console.error('Error fetching rooms:', error);
            }
        };

        fetchRooms();
        return () => {
            cancelled = true;
            if (homeWebSocket.current) {
                homeWebSocket.current.close();
                homeWebSocket.current = null;
            }
        };
    }, [navigate, setAvailableRooms, setIsAuthenticated, setUsername]);

    const handleRoomClick = (roomSlug) => {
        if (homeWebSocket.current) {
            homeWebSocket.current.close();
            homeWebSocket.current = null;
        }
        navigate(`/${roomSlug}`);
    };

    return (
        <div className="home-container">
            <h1 className="home-title">Chat Rooms</h1>
            <div className="rooms-grid">
                {rooms.map((room) => (
                    <div key={room.slug} className="room-card">
                        <div className="room-card-content">
                            <div className="room-card-details">
                                <h2 className="room-card-title">{room.name}</h2>
                                <p className="room-user-count">Active users: {room.user_count}</p>
                                <button
                                    className="join-room-button"
                                    onClick={() => handleRoomClick(room.slug)}
                                >
                                    Join Room
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;
