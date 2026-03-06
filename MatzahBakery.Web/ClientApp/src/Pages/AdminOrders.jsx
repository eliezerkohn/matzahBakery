import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-');

const AdminOrders = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateSearch, setDateSearch] = useState('');
    const [customerFilter, setCustomerFilter] = useState(searchParams.get('customerId') || '');
    const [receiptOrder, setReceiptOrder] = useState(null);

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
            const matchesCustomerFilter = !customerFilter || String(order.customerId) === String(customerFilter);
            return matchesDate && matchesCustomerFilter && matchesSearchText(order);
        });
    }, [orders, searchTerm, dateSearch, customerFilter]);

    const buildOrderItemsText = (items) => {
        if (!Array.isArray(items) || !items.length) {
            return '-';
        }

        return items
            .map((item) => `${item.quantity}x ${item.productName || 'Product'} (${item.productTypeName || 'Type'})`)
            .join(', ');
    };

    const addItemsToOrder = (order) => {
        const orderLines = (order.items || []).map((item) => ({
            productId: item.productId,
            productTypeId: item.productTypeId,
            quantity: Number(item.quantity) || 0
        }));

        navigate(`/order?customerId=${order.customerId}`, {
            state: {
                prefillOrder: {
                    fulfillmentType: order.fulfillmentType || 'pickup',
                    orderDate: order.orderDate,
                    deliveryAddress: order.deliveryAddress || '',
                    orderLines
                }
            }
        });
    };

    const getReceiptTotals = (order) => {
        const linesSubTotal = (order.items || []).reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
        const subTotal = Number(order.subTotal ?? linesSubTotal) || 0;
        const deliveryFee = Number(order.deliveryFee) || 0;
        const orderTotal = Number(order.orderTotal) || 0;
        const calculatedTax = orderTotal - subTotal - deliveryFee;
        const taxAmount = Math.max(0, calculatedTax);

        return {
            subTotal,
            taxAmount,
            deliveryFee,
            orderTotal
        };
    };

    if (loading) {
        return <div className="container py-5">Loading orders...</div>;
    }

    return (
        <div className="container py-5">
            <h1 className="order-title mb-4">All Orders</h1>

            <div className="mb-3 d-flex gap-2 align-items-center">
                <input
                    className="form-control"
                    placeholder="Search by order #, customer, product, or type"
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

            {!!customerFilter && (
                <div className="mb-3 d-flex gap-2 align-items-center">
                    <span className="badge text-bg-secondary">Customer ID: {customerFilter}</span>
                </div>
            )}

            <div className="mb-3">
                <label className="form-label">Filter by date</label>
                <div className="d-flex gap-2 align-items-center">
                    <input
                        type="date"
                        className="form-control"
                        style={{ maxWidth: '260px' }}
                        value={dateSearch}
                        onChange={(event) => setDateSearch(event.target.value)}
                    />
                    {!!dateSearch && (
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setDateSearch('')}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {message && <div className="text-danger mb-3">{message}</div>}

            {!filteredOrders.length && <div className="card p-3">No orders found.</div>}

            {!!filteredOrders.length && (
                <div className="table-responsive">
                    <table className="table table-sm table-striped align-middle">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Item Count</th>
                                <th>Order Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => {
                                return (
                                    <tr key={order.orderId}>
                                        <td>{order.orderId}</td>
                                        <td>{formatDate(order.orderDate)}</td>
                                        <td>{order.customerName || '-'} (ID: {order.customerId})</td>
                                        <td style={{ minWidth: '260px' }}>{buildOrderItemsText(order.items)}</td>
                                        <td>{Number(order.itemCount) || 0}</td>
                                        <td>{formatCurrency(order.orderTotal)}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-dark"
                                                    onClick={() => addItemsToOrder(order)}
                                                    disabled={!(order.items || []).length}
                                                >
                                                    Add Items
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => setReceiptOrder(order)}
                                                >
                                                    View Receipt
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => deleteOrder(order.orderId)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {receiptOrder && (
                <div className="order-success-overlay" role="dialog" aria-modal="true" aria-label="Order receipt">
                    <div className="order-success-modal" style={{ width: 'min(680px, 100%)' }}>
                        <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                            <div>
                                <h2 className="h5 mb-1">Receipt</h2>
                                <div className="small text-muted">Order #{receiptOrder.orderId}</div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setReceiptOrder(null)}
                            >
                                Close
                            </button>
                        </div>

                        <div className="receipt-meta mb-3">
                            <div><strong>Type:</strong> {receiptOrder.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}</div>
                            <div><strong>Date:</strong> {formatDate(receiptOrder.orderDate)}</div>
                            <div><strong>Customer:</strong> {receiptOrder.customerName || '-'} (ID: {receiptOrder.customerId})</div>
                            <div><strong>Items:</strong> {Number(receiptOrder.itemCount) || 0}</div>
                            {receiptOrder.fulfillmentType === 'delivery' && (
                                <div><strong>Deliver To:</strong> {receiptOrder.deliveryAddress || '-'}</div>
                            )}
                        </div>

                        {!(receiptOrder.items || []).length && (
                            <div className="receipt-empty">No items found for this order.</div>
                        )}

                        {!!(receiptOrder.items || []).length && (
                            <div className="receipt-lines">
                                {(receiptOrder.items || []).map((item) => (
                                    <div key={item.orderItemId || `${item.productId}-${item.productTypeId}`} className="receipt-line">
                                        <div className="receipt-line__name">{item.productName || '-'} - {item.productTypeName || '-'}</div>
                                        <div className="receipt-line__details">
                                            <span>{Number(item.quantity) || 0} x {formatCurrency(item.unitPrice)}</span>
                                            <strong>{formatCurrency(item.lineTotal)}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="receipt-total mt-3 pt-3">
                            <span>Subtotal</span>
                            <strong>{formatCurrency(getReceiptTotals(receiptOrder).subTotal)}</strong>
                        </div>

                        <div className="receipt-total mt-2 pt-2">
                            <span>Tax</span>
                            <strong>{formatCurrency(getReceiptTotals(receiptOrder).taxAmount)}</strong>
                        </div>

                        {getReceiptTotals(receiptOrder).deliveryFee > 0 && (
                            <div className="receipt-total mt-2 pt-2">
                                <span>Delivery Fee</span>
                                <strong>{formatCurrency(getReceiptTotals(receiptOrder).deliveryFee)}</strong>
                            </div>
                        )}

                        <div className="receipt-total mt-2 pt-2">
                            <span>Grand Total</span>
                            <strong>{formatCurrency(getReceiptTotals(receiptOrder).orderTotal)}</strong>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
