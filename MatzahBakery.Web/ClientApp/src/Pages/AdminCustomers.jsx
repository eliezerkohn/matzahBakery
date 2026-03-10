import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminCustomersTable from '../components/admin/customers/AdminCustomersTable';
import { safeTrim, toPositiveInt } from '../utils/security';

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
    // Tag: Navigation and page state
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCustomerId, setEditingCustomerId] = useState(null);
    const [editForm, setEditForm] = useState(emptyEditForm);

    // Tag: Data loading
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

    // Tag: Derived view data
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

    // Tag: Actions
    const startEdit = (customer) => {
        // Tag: Start Inline Edit
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
        const shouldDelete = window.confirm(`Delete customer #${id}? This action cannot be undone.`);
        if (!shouldDelete) {
            return;
        }

        try {
            await axios.delete(`/api/admin/customers/${id}`);
            setMessage('Customer deleted.');
            if (editingCustomerId === id) {
                cancelEdit();
            }
            await loadCustomers();
        } catch (error) {
            setMessage(error?.response?.data?.message || 'Could not delete customer.');
        }
    };

    const viewCustomerOrders = (customer) => {
        // Tag: Navigate To Filtered Orders
        const customerId = toPositiveInt(customer?.id);
        if (!customerId) {
            setMessage('Could not open orders for this customer.');
            return;
        }

        const customerName = safeTrim(`${customer?.firstName || ''} ${customer?.lastName || ''}`, 120);
        const query = new URLSearchParams({ customerId: String(customerId) });
        if (customerName) {
            query.set('customerName', customerName);
        }

        navigate(`/admin/orders?${query.toString()}`);
    };

    const addOrderForCustomer = (customerId) => {
        const safeCustomerId = toPositiveInt(customerId);
        if (!safeCustomerId) {
            setMessage('Could not start order because customer id is invalid.');
            return;
        }

        navigate(`/order?customerId=${safeCustomerId}`);
    };

    if (loading) {
        return <div className="container py-5">Loading customers...</div>;
    }

    return (
        <div className="container py-5 page-admin-customers">
            {/* Tag: Page Title */}
            <div className="page-hero mb-4">
                <h1 className="order-title mb-1">All Customers</h1>
                <p className="page-subtitle mb-0">Update profiles, start orders quickly, and jump to each customer order history.</p>
            </div>

            {/* Tag: Search Section */}
            <div className="mb-3 d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center">
                <input
                    className="form-control"
                    placeholder="Search by id, name, email, phone, or address"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                />
                {!!searchTerm && (
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary align-self-start"
                        onClick={() => setSearchTerm('')}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Tag: Page Message */}
            {message && <div className="mb-3 text-danger">{message}</div>}

            {/* Tag: Customers List */}
            <AdminCustomersTable
                filteredCustomers={filteredCustomers}
                editingCustomerId={editingCustomerId}
                editForm={editForm}
                onEditFormChange={setEditForm}
                onStartEdit={startEdit}
                onSaveCustomer={saveCustomer}
                onCancelEdit={cancelEdit}
                onDeleteCustomer={deleteCustomer}
                onAddOrderForCustomer={addOrderForCustomer}
                onViewCustomerOrders={viewCustomerOrders}
            />
        </div>
    );
};

export default AdminCustomers;
