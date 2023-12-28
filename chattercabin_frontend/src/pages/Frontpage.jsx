import React from 'react';
import ChatterCabin_logo from '../logo/ChatterCabin_logo.png';
import '../App.css';

const FrontPage = () => {
    return (
        <div className="frontpage-container">
            <img
                src={ChatterCabin_logo}
                alt="Chatter Cabin Logo"
                className="frontpage-logo"
            />
        </div>
    );
};

export default FrontPage;
