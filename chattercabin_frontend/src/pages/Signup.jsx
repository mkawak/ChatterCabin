import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {getCsrfToken} from '../components/Auth';
import '../App.css';

const SignUpPage = ({setIsAuthenticated, setUsername}) => {
    const [username, setLocalUsername] = useState('');
    const [password1, setPassword1] = useState('');
    const [password2, setPassword2] = useState('');
    const [errors, setErrors] = useState([]);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors([]);

        if (password1 !== password2) {
            setErrors(['Passwords do not match']);
            return;
        }

        try {
            const response = await fetch('/api/signup/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({username, password: password1}),
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
            setErrors(['An error occurred during sign-up.']);
        }
    };

    return (
        <div className="signup-container">
            <h1 className="signup-title">Signup</h1>
            <form onSubmit={handleSubmit} className="signup-form">
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
                    <label htmlFor="password1">Password</label>
                    <input
                        type="password"
                        name="password1"
                        id="password1"
                        value={password1}
                        onChange={(event) => setPassword1(event.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="password2">Repeat Password</label>
                    <input
                        type="password"
                        name="password2"
                        id="password2"
                        value={password2}
                        onChange={(event) => setPassword2(event.target.value)}
                    />
                </div>
                <div className="submit-btn-container">
                    <button type="submit" className="submit-btn">Submit</button>
                </div>
            </form>
        </div>
    );
};

export default SignUpPage;
