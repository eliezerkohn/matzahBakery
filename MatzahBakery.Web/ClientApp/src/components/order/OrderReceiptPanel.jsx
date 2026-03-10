const OrderReceiptPanel = ({
    canShowViewOrders,
    onViewOrders,
    fulfillmentType,
    fulfillmentDate,
    customer,
    totalItemCount,
    deliveryAddressForOrder,
    selectedLines,
    getLineKey,
    formatCurrency,
    subTotal,
    deliveryFee,
    orderTotal
}) => {
    return (
        <aside className="order-receipt-column">
            {canShowViewOrders && (
                <div className="card order-card order-view-orders-card mb-2">
                    <div className="card-body order-view-orders-body d-flex justify-content-between align-items-center gap-2">
                        <div className="text-muted order-view-orders-text">Need past orders?</div>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-dark order-view-orders-btn"
                            onClick={onViewOrders}
                        >
                            View Orders
                        </button>
                    </div>
                </div>
            )}

            <div className="card order-receipt-card">
                <div className="card-body">
                    <h2 className="h5 mb-1">Receipt</h2>
                    <small className="text-muted" style={{ display: 'block', marginBottom: '10px' }}>
                        Review your order details here as you build.
                    </small>

                    <div className="receipt-meta mb-3">
                        <div><strong>Type:</strong> {fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}</div>
                        <div><strong>Date:</strong> {fulfillmentDate || '-'}</div>
                        <div><strong>Customer:</strong> {(customer?.firstName || '-') + ' ' + (customer?.lastName || '')}</div>
                        <div><strong>Items:</strong> {totalItemCount}</div>
                        {fulfillmentType === 'delivery' && (
                            <div><strong>Deliver To:</strong> {deliveryAddressForOrder || '-'}</div>
                        )}
                    </div>

                    {!selectedLines.length && (
                        <div className="receipt-empty">No items selected yet.</div>
                    )}

                    {!!selectedLines.length && (
                        <div className="receipt-lines">
                            {selectedLines.map((line) => (
                                <div key={getLineKey(line.productId, line.productTypeId)} className="receipt-line">
                                    <div className="receipt-line__name">{line.productName} - {line.productTypeName}</div>
                                    <div className="receipt-line__details">
                                        <span>{line.quantity} x {formatCurrency(line.unitPrice)}</span>
                                        <strong>{formatCurrency(line.lineTotal)}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="receipt-total mt-3 pt-3">
                        <span>Subtotal</span>
                        <strong>{formatCurrency(subTotal)}</strong>
                    </div>

                    {deliveryFee > 0 && (
                        <div className="receipt-total mt-2 pt-2">
                            <span>Delivery Fee</span>
                            <strong>{formatCurrency(deliveryFee)}</strong>
                        </div>
                    )}

                    <div className="receipt-total mt-2 pt-2">
                        <span>Grand Total</span>
                        <strong>{formatCurrency(orderTotal)}</strong>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default OrderReceiptPanel;
