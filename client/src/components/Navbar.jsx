import { Link } from "react-router-dom";
import logoFull from "../assets/logo/logo-full.png";
import "./Navbar.css";

const NAV_LINKS = [
  { label: "Products", to: "/products" },
  { label: "Projects", to: "/projects" },
  { label: "Application", to: "/application" },
  { label: "Company", to: "/company" },
  { label: "Shop", to: "/shop" },
];

function GlobeIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke="#0B121A" strokeWidth="1.5" />
      <ellipse
        cx="8"
        cy="8"
        rx="2.7"
        ry="6.5"
        stroke="#0B121A"
        strokeWidth="1.5"
      />
      <line
        x1="1.5"
        y1="8"
        x2="14.5"
        y2="8"
        stroke="#0B121A"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="8"
      height="4"
      viewBox="0 0 8 4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 1L4 3L7 1"
        stroke="#0B121A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <img src={logoFull} alt="Filamento" />
        </Link>

        <nav className="navbar-links">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="navbar-actions">
          <Link to="/contact" className="navbar-cta">
            Contact
          </Link>
          <button type="button" className="navbar-lang">
            <GlobeIcon />
            <span>EN</span>
            <ChevronIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
