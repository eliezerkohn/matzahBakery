import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminOrdersFilters from '../components/admin/orders/AdminOrdersFilters';
import AdminOrdersTable from '../components/admin/orders/AdminOrdersTable';
import AdminOrderReceiptModal from '../components/admin/orders/AdminOrderReceiptModal';
import { formatCurrency, formatDate } from '../utils/formatters';

const AdminOrders = () => {
    // Tag: Navigation and page state
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateSearch, setDateSearch] = useState('');
    const [customerFilter, setCustomerFilter] = useState(searchParams.get('customerId') || '');
    const [receiptOrder, setReceiptOrder] = useState(null);
    const customerNameFromQuery = (searchParams.get('customerName') || '').trim();

    // Tag: Data loading
    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/orders');
            setOrders(Array.isArray(response.data) ? response.data : []);
            setMessage('');
        } catch {
            setMessage('Could not load orders from backend API.');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        setCustomerFilter(searchParams.get('customerId') || '');
    }, [searchParams]);

    // Tag: Actions
    const deleteOrder = async (orderId) => {
        try {
            await axios.delete(`/api/orders/${orderId}`);
            setMessage('Order deleted.');
            await loadOrders();
        } catch (error) {
            if (error?.response?.status === 404) {
                setMessage('Order already deleted. List refreshed.');
                await loadOrders();
                return;
            }

            setMessage(error?.response?.data?.message || 'Could not delete order.');
        }
    };

    const addItemsToOrder = (order) => {
        // Tag: Edit Order Prefill Lines
        const orderLines = (order.items || []).map((item) => ({
            productId: item.productId,
            productTypeId: item.productTypeId,
            quantity: Number(item.quantity) || 0
        }));

        navigate(`/order?customerId=${order.customerId}`, {
            state: {
                prefillOrder: {
                    orderId: order.orderId,
                    fulfillmentType: order.fulfillmentType || 'pickup',
                    orderDate: order.orderDate,
                    deliveryAddress: order.deliveryAddress || '',
                    orderLines
                }
            }
        });
    };

    // Tag: Derived view data
    const filteredOrders = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        const matchesSearchText = (order) => {
            if (!query) {
                return true;
            }

            const matchesOrderNumber = String(order.orderId || '').includes(query);
            const matchesCustomerName = String(order.customerName || '').toLowerCase().includes(query);
            const matchesAnyItem = (order.items || []).some((item) =>
                String(item.productName || '').toLowerCase().includes(query)
                || String(item.productTypeName || '').toLowerCase().includes(query)
            );

            return matchesOrderNumber || matchesCustomerName || matchesAnyItem;
        };

        return orders.filter((order) => {
            const orderDateValue = String(order.orderDate || '').slice(0, 10);
            const matchesDate = !dateSearch || orderDateValue === dateSearch;
            const matchesCustomer = !customerFilter || String(order.customerId) === String(customerFilter);
            return matchesDate && matchesCustomer && matchesSearchText(order);
        });
    }, [orders, searchTerm, dateSearch, customerFilter]);

    const buildOrderItemsText = (items) => {
        // Tag: Items Cell Text Formatter
        if (!Array.isArray(items) || !items.length) {
            return '-';
        }

        return items
            .map((item) => `${item.quantity}x ${item.productName || 'Product'} (${item.productTypeName || 'Type'})`)
            .join(', ');
    };

    const getReceiptTotals = (order) => {
        const linesSubTotal = (order.items || []).reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
        const subTotal = Number(order.subTotal ?? linesSubTotal) || 0;
        const deliveryFee = Number(order.deliveryFee) || 0;
        const fallbackTotal = subTotal + deliveryFee;
        const orderTotal = Number(order.orderTotal ?? fallbackTotal) || fallbackTotal;

        return {
            subTotal,
            deliveryFee,
            orderTotal
        };
    };

    const pageTitle = useMemo(() => {
        if (!customerFilter) {
            return 'All Orders';
        }

        if (customerNameFromQuery) {
            return `${customerNameFromQuery} Orders`;
        }

        const fallbackName = orders.find((order) => String(order.customerId) === String(customerFilter))?.customerName;
        return fallbackName ? `${fallbackName} Orders` : 'Customer Orders';
    }, [customerFilter, customerNameFromQuery, orders]);

    if (loading) {
        return <div className="container py-5">Loading orders...</div>;
    }

    return (
        <div className="container py-5">
            {/* Tag: Page Title */}
            <h1 className="order-title mb-4">{pageTitle}</h1>

            {/* Tag: Filters Section */}
            <AdminOrdersFilters
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                onClearSearch={() => setSearchTerm('')}
                customerFilter={customerFilter}
                dateSearch={dateSearch}
                onDateSearchChange={setDateSearch}
                onClearDate={() => setDateSearch('')}
            />

            {/* Tag: Page Message */}
            {message && <div className="text-danger mb-3">{message}</div>}

            {/* Tag: Orders List */}
            <AdminOrdersTable
                filteredOrders={filteredOrders}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                buildOrderItemsText={buildOrderItemsText}
                onEditOrder={addItemsToOrder}
                onViewReceipt={setReceiptOrder}
                onDeleteOrder={deleteOrder}
            />

            {/* Tag: Receipt Modal */}
            <AdminOrderReceiptModal
                receiptOrder={receiptOrder}
                onClose={() => setReceiptOrder(null)}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getReceiptTotals={getReceiptTotals}
            />
        </div>
    );
};

export default AdminOrders;
