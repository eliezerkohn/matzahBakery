import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');

const emptyEditForm = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: ''
};

const AdminCustomers = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCustomerId, setEditingCustomerId] = useState(null);
    const [editForm, setEditForm] = useState(emptyEditForm);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedCustomerOrders, setSelectedCustomerOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/customers');
            setCustomers(Array.isArray(response.data) ? response.data : []);
            setMessage('');
        } catch {
            setCustomers([]);
            setMessage('Could not load customers from backend API.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    const filteredCustomers = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) {
            return customers;
        }

        return customers.filter((customer) =>
            String(customer.id || '').includes(query)
            || String(customer.firstName || '').toLowerCase().includes(query)
            || String(customer.lastName || '').toLowerCase().includes(query)
            || String(customer.email || '').toLowerCase().includes(query)
            || String(customer.phoneNumber || '').toLowerCase().includes(query)
            || String(customer.address || '').toLowerCase().includes(query)
            || String(customer.apartment || '').toLowerCase().includes(query)
            || String(customer.city || '').toLowerCase().includes(query)
            || String(customer.state || '').toLowerCase().includes(query)
            || String(customer.zipCode || '').toLowerCase().includes(query)
        );
    }, [customers, searchTerm]);

    const startEdit = (customer) => {
        setEditingCustomerId(customer.id);
        setEditForm({
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            email: customer.email || '',
            phoneNumber: customer.phoneNumber || '',
            address: customer.address || '',
            apartment: customer.apartment || '',
            city: customer.city || '',
            state: customer.state || '',
            zipCode: customer.zipCode || ''
        });
    };

    const cancelEdit = () => {
        setEditingCustomerId(null);
        setEditForm(emptyEditForm);
    };

    const saveCustomer = async (id) => {
        try {
            await axios.put(`/api/admin/customers/${id}`, editForm);
            setMessage('Customer updated.');
            cancelEdit();
            await loadCustomers();
        } catch (error) {
            setMessage(error?.response?.data?.message || 'Could not update customer.');
        }
    };

    const deleteCustomer = async (id) => {
        try {
            await axios.delete(`/api/admin/customers/${id}`);
            setMessage('Customer deleted.');
            if (editingCustomerId === id) {
                cancelEdit();
            }
            if (selectedCustomer?.id === id) {
                setSelectedCustomer(null);
                setSelectedCustomerOrders([]);
            }
            await loadCustomers();
        } catch (error) {
            setMessage(error?.response?.data?.message || 'Could not delete customer.');
        }
    };

    const viewCustomerOrders = async (customer) => {
        setSelectedCustomer(customer);
        setOrdersLoading(true);
        try {
            const response = await axios.get('/api/orders');
            const allOrders = Array.isArray(response.data) ? response.data : [];
            const orders = allOrders.filter((order) => Number(order.customerId) === Number(customer.id));
            setSelectedCustomerOrders(orders);
            setMessage('');
        } catch {
            setSelectedCustomerOrders([]);
            setMessage('Could not load orders for this customer.');
        } finally {
            setOrdersLoading(false);
        }
    };

    const addOrderForCustomer = (customerId) => {
        navigate(`/order?customerId=${customerId}`);
    };

    if (loading) {
        return <div className="container py-5">Loading customers...</div>;
    }

    return (
        <div className="container py-5">
            <h1 className="order-title mb-4">All Customers</h1>

            <div className="mb-3 d-flex gap-2 align-items-center">
                <input
                    className="form-control"
                    placeholder="Search by id, name, email, phone, or address"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                />
                {!!searchTerm && (
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setSearchTerm('')}
                    >
                        Clear
                    </button>
                )}
            </div>

            {message && <div className="mb-3 text-danger">{message}</div>}

            <div className="table-responsive">
                <table className="table table-striped align-middle">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Apt</th>
                            <th>City</th>
                            <th>State</th>
                            <th>Zip</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!filteredCustomers.length && (
                            <tr>
                                <td colSpan={13} className="text-muted">No customers found.</td>
                            </tr>
                        )}
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.id}>
                                <td>{customer.id}</td>
                                <td>
                                    {editingCustomerId === customer.id ? (
                                        <input
                                            className="form-control form-control-sm"
                                            value={editForm.firstName}
                                            onChange={(event) => setEditForm((prev) => ({ ...prev, firstName: event.target.value }))}
                                        />
                                    ) : (
                                        customer.firstName || '-'
                                    )}
                                </td>
                                <td>
                                    {editingCustomerId === customer.id ? (
                                        <input
                                            className="form-control form-control-sm"
                                            value={editForm.lastName}
                                            onChange={(event) => setEditForm((prev) => ({ ...prev, lastName: event.target.value }))}
                                        />
                                    ) : (
                                        customer.lastName || '-'
                                    )}
                                </td>
                                <td>
                                    {editingCustomerId === customer.id ? (
                                        <input
                                            className="form-control form-control-sm"
                                            value={editForm.email}
                                            onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                                        />
                                    ) : (
                                        customer.email || '-'
                                    )}
                                </td>
                                <td>
                                    {editingCustomerId === customer.id ? (
                                        <input
                                            className="form-control form-control-sm"
                                            value={editForm.phoneNumber}
                                            onChange={(event) => setEditForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                                        />
                                    ) : (
                                        customer.phoneNumber || '-'
                                    )}
                                </td>
                                <td>
                                    {editingCustomerId === customer.id ? (
                                        <input
                                            className="form-control form-control-sm"
                                            value={editForm.address}
                                            onChange={(event) => setEditForm((prev) => ({ ...prev, address: event.target.value }))}
                                        />
                                    ) : (
                                        customer.address || '-'
                                    )}
                                </td>
                                <td>
                                    {editingCustomerId === customer.id ? (
                                        <input
                                            className="form-control form-control-sm"
                                            value={editForm.apartment}
                                            onChange={(event) => setEditForm((prev) => ({ ...prev, apartment: event.target.value }))}
                                        />
                                    ) : (
                                        customer.apartment || '-'
                                    )}
                                </td>
                                <td>
                                    {editingCustomerId === customer.id ? (
                                        <input
                                            className="form-control form-control-sm"
                                            value={editForm.city}
                                            onChange={(event) => setEditForm((prev) => ({ ...prev, city: event.target.value }))}
                                        />
                                    ) : (
                                        customer.city || '-'
                                    )}
                                </td>
                                <td>
                                    {editingCustomerId === customer.id ? (
                                        <input
                                            className="form-control form-control-sm"
                                            value={editForm.state}
                                            onChange={(event) => setEditForm((prev) => ({ ...prev, state: event.target.value }))}
                                        />
                                    ) : (
                                        customer.state || '-'
                                    )}
                                </td>
                                <td>
                                    {editingCustomerId === customer.id ? (
                                        <input
                                            className="form-control form-control-sm"
                                            value={editForm.zipCode}
                                            onChange={(event) => setEditForm((prev) => ({ ...prev, zipCode: event.target.value }))}
                                        />
                                    ) : (
                                        customer.zipCode || '-'
                                    )}
                                </td>
                                <td>
                                    {editingCustomerId === customer.id ? (
                                        <div className="d-flex gap-2">
                                            <button type="button" className="btn btn-sm btn-dark" onClick={() => saveCustomer(customer.id)}>
                                                Save
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cancelEdit}>
                                                Cancel
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-success" onClick={() => addOrderForCustomer(customer.id)}>
                                                Add Order
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => viewCustomerOrders(customer)}>
                                                View Orders
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="d-flex gap-2">
                                            <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => startEdit(customer)}>
                                                Edit
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteCustomer(customer.id)}>
                                                Delete
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-success" onClick={() => addOrderForCustomer(customer.id)}>
                                                Add Order
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => viewCustomerOrders(customer)}>
                                                View Orders
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedCustomer && (
                <div className="card mt-4">
                    <div className="card-body">
                        <h2 className="h5 mb-3">
                            Orders for {selectedCustomer.firstName || '-'} {selectedCustomer.lastName || '-'} (ID: {selectedCustomer.id})
                        </h2>

                        {ordersLoading && <div>Loading orders...</div>}

                        {!ordersLoading && !selectedCustomerOrders.length && (
                            <div className="text-muted">No orders found for this customer.</div>
                        )}

                        {!ordersLoading && !!selectedCustomerOrders.length && (
                            <div className="table-responsive">
                                <table className="table table-sm table-striped mb-0">
                                    <thead>
                                        <tr>
                                            <th>Order #</th>
                                            <th>Date</th>
                                            <th>Items</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedCustomerOrders.map((order) => (
                                            <tr key={order.orderId}>
                                                <td>{order.orderId}</td>
                                                <td>{formatDate(order.orderDate)}</td>
                                                <td>{order.itemCount || 0}</td>
                                                <td>{formatCurrency(order.orderTotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCustomers;
