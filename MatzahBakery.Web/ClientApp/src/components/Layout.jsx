import { Link } from 'react-router-dom';

const navItems = [
    { to: '/', label: 'Home' },
    { to: '/contact', label: 'Contact' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/customers', label: 'Customers' },
    { to: '/admin', label: 'Admin' }
];

const Layout = ({ children }) => {
    return (
        <div className="app-shell">
            <header>
                <nav className="navbar navbar-expand-sm navbar-dark fixed-top bg-dark border-bottom box-shadow">
                    <div className="container">
                        <a className="navbar-brand">Matzah Bakery</a>
                        <button className="navbar-toggler" type="button" data-toggle="collapse"
                            data-target=".navbar-collapse" aria-controls="navbarSupportedContent"
                            aria-expanded="false" aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        <div className="navbar-collapse collapse d-sm-inline-flex justify-content-between">
                            <ul className="navbar-nav flex-grow-1">
                                {navItems.map((item) => (
                                    <li className="nav-item" key={item.to}>
                                        <Link to={item.to} className="nav-link text-light">{item.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </nav>
            </header>
            <div className="app-content container-fluid mt-5 px-0">
                {children}
            </div>
        </div>
    )
}

export default Layout;