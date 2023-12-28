import React from 'react';
import '../App.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <p className="footer-text">
        &copy; 2023 ChatterCabin by{' '}
        <a href="https://www.majdkawak.com" target="_blank" rel="noopener noreferrer" className="footer-link">
           Majd Kawak
        </a>
      </p>
    </footer>
  );
};

export default Footer;
