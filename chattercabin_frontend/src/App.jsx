import React, {useEffect, useState} from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Frontpage from './pages/Frontpage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Room from './pages/Room';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

const storedRooms = () => {
    try {
        const rooms = JSON.parse(localStorage.getItem('availableRooms') || '[]');
        return Array.isArray(rooms) ? rooms : [];
    } catch {
        localStorage.removeItem('availableRooms');
        return [];
    }
};

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('token') !== null);
    const [username, setUsername] = useState(localStorage.getItem('username') || '');
    const [availableRooms, setAvailableRooms] = useState(storedRooms);

    useEffect(() => {
        const syncAuthentication = () => {
            setIsAuthenticated(localStorage.getItem('token') !== null);
            setUsername(localStorage.getItem('username') || '');
            setAvailableRooms(storedRooms());
        };

        window.addEventListener('storage', syncAuthentication);
        return () => window.removeEventListener('storage', syncAuthentication);
    }, []);

    return (
        <Router>
            <Navbar
                isAuthenticated={isAuthenticated}
                username={username}
                setIsAuthenticated={setIsAuthenticated}
                setUsername={setUsername}
            />
            <Routes>
                <Route path="/" element={<Frontpage/>}/>
                <Route
                    path="/login"
                    element={
                        <Login
                            setIsAuthenticated={setIsAuthenticated}
                            setUsername={setUsername}
                        />
                    }
                />
                <Route
                    path="/signup"
                    element={
                        <Signup
                            setIsAuthenticated={setIsAuthenticated}
                            setUsername={setUsername}
                        />
                    }
                />
                <Route
                    path="/home"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <Home
                                setAvailableRooms={setAvailableRooms}
                                setIsAuthenticated={setIsAuthenticated}
                                setUsername={setUsername}
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/:roomSlug"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <Room
                                availableRooms={availableRooms}
                                setIsAuthenticated={setIsAuthenticated}
                                setUsername={setUsername}
                            />
                        </ProtectedRoute>
                    }
                />
                <Route path="/notfound" element={<NotFound/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
            <Footer/>
        </Router>
    );
}

export default App;
