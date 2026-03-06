import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './Pages/Home';
import Order from './Pages/Order';
import Admin from './Pages/Admin';
import AdminOrders from './Pages/AdminOrders';
import AdminCustomers from './Pages/AdminCustomers';
import Contact from './Pages/Contact';

const App = () => {
    return (
        <Layout>
            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/order' element={<Order />} />
                <Route path='/admin' element={<Admin />} />
                <Route path='/admin/orders' element={<AdminOrders />} />
                <Route path='/admin/customers' element={<AdminCustomers />} />
                <Route path='/contact' element={<Contact />} />
                <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
        </Layout>
    );
}

export default App;