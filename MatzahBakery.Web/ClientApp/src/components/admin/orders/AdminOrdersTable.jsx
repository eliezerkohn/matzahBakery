const AdminOrdersTable = ({ filteredOrders, formatDate, formatCurrency, buildOrderItemsText, onEditOrder, onViewReceipt, onDeleteOrder }) => {
    // Tag: Empty State
    if (!filteredOrders.length) {
        return <div className="card p-3">No orders found.</div>;
    }

    return (
        // Tag: Orders Data Table
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
                    {/* Tag: Order Rows */}
                    {filteredOrders.map((order) => (
                        <tr key={order.orderId}>
                            <td>{order.orderId}</td>
                            <td>{formatDate(order.orderDate)}</td>
                            <td>{order.customerName || '-'} (ID: {order.customerId})</td>
                            <td style={{ minWidth: '260px' }}>{buildOrderItemsText(order.items)}</td>
                            <td>{Number(order.itemCount) || 0}</td>
                            <td>{formatCurrency(order.orderTotal)}</td>
                            <td>
                                {/* Tag: Row Actions */}
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-dark"
                                        onClick={() => onEditOrder(order)}
                                        disabled={!(order.items || []).length}
                                    >
                                        Edit Order
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => onViewReceipt(order)}
                                    >
                                        View Receipt
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => onDeleteOrder(order.orderId)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminOrdersTable;
