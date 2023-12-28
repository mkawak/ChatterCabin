import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {getCsrfToken} from '../components/Auth';
import '../App.css';

const Login = ({setIsAuthenticated, setUsername}) => {
    const [username, setLocalUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState([]);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors([]);

        try {
            const response = await fetch('/api/login/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({username, password}),
            });

            const data = await response.json();
            if (!response.ok || !data.token) {
                setErrors([data.error || 'Something went wrong']);
                return;
            }

            localStorage.removeItem('availableRooms');
            localStorage.setItem('token', data.token.access);
            localStorage.setItem('refresh_token', data.token.refresh);
            localStorage.setItem('username', username);
            setIsAuthenticated(true);
            setUsername(username);
            navigate('/home');
        } catch (error) {
            console.error('Error:', error);
            setErrors(['An error occurred during login.']);
        }
    };

    return (
        <div className="login-container">
            <h1 className="login-title">Login</h1>
            <form onSubmit={handleSubmit} className="login-form">
                {errors.length > 0 && (
                    <div className="error-container">
                        {errors.map((error, index) => (
                            <p key={index}>{error}</p>
                        ))}
                    </div>
                )}
                <div className="input-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        name="username"
                        id="username"
                        value={username}
                        onChange={(event) => setLocalUsername(event.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        name="password"
                        id="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </div>
                <div className="submit-btn-container">
                    <button type="submit" className="submit-btn">Submit</button>
                </div>
            </form>
        </div>
    );
};

export default Login;
