import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
    { to: '/', label: 'Home' },
    { to: '/contact', label: 'Contact' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/customers', label: 'Customers' },
    { to: '/admin', label: 'Admin' }
];

const Layout = ({ children }) => {
    const location = useLocation();
    const [isNavOpen, setIsNavOpen] = useState(false);

    useEffect(() => {
        setIsNavOpen(false);
    }, [location.pathname, location.search]);

    return (
        <div className="app-shell">
            <header>
                <nav className="navbar navbar-expand-sm navbar-dark fixed-top bg-dark border-bottom box-shadow">
                    <div className="container">
                        <span className="navbar-brand">Satmar Matzah Bakery</span>
                        <button
                            className="navbar-toggler"
                            type="button"
                            aria-controls="main-nav"
                            aria-expanded={isNavOpen}
                            aria-label="Toggle navigation"
                            onClick={() => setIsNavOpen((prev) => !prev)}
                        >
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        <div
                            id="main-nav"
                            className={`navbar-collapse collapse ${isNavOpen ? 'show' : ''} d-sm-inline-flex justify-content-between`}
                        >
                            <ul className="navbar-nav flex-grow-1">
                                {navItems.map((item) => (
                                    <li className="nav-item" key={item.to}>
                                        <Link to={item.to} className="nav-link text-light" onClick={() => setIsNavOpen(false)}>
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </nav>
            </header>
            <div className="app-content container-fluid px-0">
                {children}
            </div>
        </div>
    )
}

export default Layout;