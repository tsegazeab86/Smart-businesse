
import { Link } from "react-router-dom";
import { Store, Mail, MapPin } from "lucide-react"; 
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <Store size={26} />
            <strong>InjibaraSmart</strong>
          </Link>

          <p>
            A modern digital marketplace connecting
            customers with great products and local businesses.
          </p>
        </div>

        <div className="footer-column">
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/cart">Shopping Cart</Link>
        </div>

        <div className="footer-column">
          <h3>My Account</h3>
          <Link to="/login">Login</Link>
          <Link to="/register">Create Account</Link>
          <Link to="/orders">My Orders</Link>
        </div>

        <div className="footer-column">
          <h3>Contact</h3>
          <p><MapPin size={16} /> Injibara, Ethiopia</p>
          <p><Mail size={16} /> Contact details coming soon</p>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>
          © {new Date().getFullYear()} Injibara Smart Business.
          All rights reserved.
        </p>
        <span>Built with React & Node.js</span>
      </div>
    </footer>
  );
}

export default Footer;
