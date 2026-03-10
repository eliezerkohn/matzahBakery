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

    const isActivePath = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }

        return location.pathname.startsWith(path);
    };

    useEffect(() => {
        setIsNavOpen(false);
    }, [location.pathname, location.search]);

    return (
        <div className="app-shell">
            <header>
                <nav className="navbar navbar-expand-sm fixed-top app-navbar border-bottom box-shadow">
                    <div className="container">
                        <span className="navbar-brand app-navbar__brand" aria-label="Satmar Matzah Bakery">
                            <span className="app-navbar__brand-wrap">
                                <img src="/SatmarMatzah.svg" alt="" className="app-navbar__logo" />
                                <span className="app-navbar__wordmark">Satmar Matzah Bakery</span>
                            </span>
                        </span>
                        <button
                            className="navbar-toggler app-navbar__toggler"
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
                            className={`navbar-collapse collapse ${isNavOpen ? 'show' : ''} d-sm-inline-flex justify-content-sm-end`}
                        >
                            <ul className="navbar-nav ms-sm-auto align-items-sm-center">
                                {navItems.map((item) => (
                                    <li className="nav-item" key={item.to}>
                                        <Link
                                            to={item.to}
                                            className={`nav-link app-nav-link ${isActivePath(item.to) ? 'is-active' : ''}`}
                                            onClick={() => setIsNavOpen(false)}
                                        >
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