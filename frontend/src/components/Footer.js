// src/components/Footer.js
import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        {/* Contact Section */}
        <div className="footer-section">
          <h3>Contact Us</h3>
          <p className="contact-text">
            Feel free to Contact Us. We'll get back to you soon.
          </p>
          <div className="contact-details">
            <p>📍 Assalihah Ladies Arabic College</p>
            <p>🏪 New Bakka taste shop</p>
            <p>📞 +94 67 226 0343</p>
            <a 
              href="https://assalihath.com/" 
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              ✉️ info@assalihath.com
            </a>
          </div>
        </div>

        {/* Follow Us Section */}
        <div className="footer-section">
          <h3>Follow Us</h3>
          <div className="social-icons">
            <a 
              href="https://facebook.com/yourpage" 
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              📘 Facebook
            </a>
            <a 
              href="https://instagram.com/yourpage" 
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              📷 Instagram
            </a>
            <a 
              href="https://youtube.com/yourchannel" 
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              ▶️ YouTube
            </a>
            <a 
              href="https://api.whatsapp.com/send/?phone=772308751&text&type=phone_number&app_absent=0" 
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 WhatsApp
            </a>
            <a 
              href="https://maps.google.com/?q=Assalihah+Ladies+Arabic+College" 
              className="social-link map-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              📍 Open in Maps
            </a>
          </div>
        </div>

        {/* Map Info Section */}
        <div className="footer-section">
          <h3>Location</h3>
          <div className="map-info">
            <p>Bund Road, Sennal Gramam-01</p>
            <p>Sammanthurai, Sri Lanka</p>
            <div className="map-links">
              <span>Keyboard shortcuts</span>
              <span>Map data ©{currentYear}</span>
              <button className="map-link-btn">Terms</button>
              <button className="map-link-btn">Report a map error</button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>Copyright © {currentYear} As-Salihah Ladies Arabic College</p>
          <p className="developer-credit">
            Developed by{' '}
            <strong>Zainab Thuqa Basheer</strong>{' '}
            — Full‑Stack MERN Developer{' '}
            <span className="dev-contact">
              | For contact: <a href="https://wa.me/94787788342" className="contact-link" target="_blank" rel="noopener noreferrer">078 778 8342 (WA)</a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;