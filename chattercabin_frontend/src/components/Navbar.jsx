import React from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import ChatterCabin_logo from '../logo/ChatterCabin_logo.png';
import logout from '../pages/Logout';
import '../App.css';

const Navbar = ({isAuthenticated, username, setIsAuthenticated, setUsername}) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(navigate, setIsAuthenticated, setUsername);
    };

    return (
        <nav className="navbar-container">
            {isAuthenticated ? (
                <div className="navbar-username">
                    <p className="navbar-username-text">{username}</p>
                </div>
            ) : (
                <div className="navbar-empty-space"></div>
            )}

            {location.pathname === '/' ? (
                <h1 className="navbar-title-text">ChatterCabin</h1>
            ) : (
                <Link to="/">
                    <img src={ChatterCabin_logo} alt="Chatter Cabin Logo" className="navbar-logo"/>
                </Link>
            )}

            <div className="navbar-buttons">
                {isAuthenticated ? (
                    <>
                        <Link to="/home" className="navbar-btn rooms-btn" id="rooms_button">
                            Rooms
                        </Link>
                        <Link to="/home" id="rooms_icon">
                            <span className="material-icons">forum</span>
                        </Link>

                        <Link to="/" className="navbar-btn logout-btn" id="logout_button" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                            Logout
                        </Link>
                        <Link to="/" id="logout_icon" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                            <span className="material-icons">logout</span>
                        </Link>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="navbar-btn login-btn" id="login_button">
                            Login
                        </Link>
                        <Link to="/login" id="login_icon">
                            <span className="material-icons">login</span>
                        </Link>

                        <Link to="/signup" className="navbar-btn signup-btn" id="signup_button">
                            Signup
                        </Link>
                        <Link to="/signup" id="signup_icon">
                            <span className="material-icons">person_add</span>
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
