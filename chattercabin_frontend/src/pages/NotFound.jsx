import React from 'react';
import {useNavigate} from 'react-router-dom';
import '../App.css';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="notfound-container">
            <h1 className="notfound-title">404 - Page Not Found</h1>
            <p className="notfound-text">Sorry, The page you're looking for does not exist.</p>
            <button className="notfound-button" onClick={() => navigate('/')}>
                Go Back to Home
            </button>
        </div>
    );
};

export default NotFound;
