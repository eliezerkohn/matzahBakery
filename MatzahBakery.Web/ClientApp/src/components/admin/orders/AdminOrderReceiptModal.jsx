const AdminOrderReceiptModal = ({ receiptOrder, onClose, formatDate, formatCurrency, getReceiptTotals }) => {
    // Tag: Guard Clause
    if (!receiptOrder) {
        return null;
    }

    // Tag: Derived Totals
    const totals = getReceiptTotals(receiptOrder);

    return (
        // Tag: Receipt Modal Shell
        <div className="order-success-overlay" role="dialog" aria-modal="true" aria-label="Order receipt">
            <div className="order-success-modal" style={{ width: 'min(680px, 100%)' }}>
                {/* Tag: Header */}
                <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                    <div>
                        <h2 className="h5 mb-1">Receipt</h2>
                        <div className="small text-muted">Order #{receiptOrder.orderId}</div>
                    </div>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>

                {/* Tag: Receipt Metadata */}
                <div className="receipt-meta mb-3">
                    <div><strong>Type:</strong> {receiptOrder.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}</div>
                    <div><strong>Date:</strong> {formatDate(receiptOrder.orderDate)}</div>
                    <div><strong>Customer:</strong> {receiptOrder.customerName || '-'} (ID: {receiptOrder.customerId})</div>
                    <div><strong>Items:</strong> {Number(receiptOrder.itemCount) || 0}</div>
                    {receiptOrder.fulfillmentType === 'delivery' && (
                        <div><strong>Deliver To:</strong> {receiptOrder.deliveryAddress || '-'}</div>
                    )}
                </div>

                {/* Tag: Empty Items State */}
                {!(receiptOrder.items || []).length && (
                    <div className="receipt-empty">No items found for this order.</div>
                )}

                {/* Tag: Receipt Line Items */}
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

                {/* Tag: Totals - Subtotal */}
                <div className="receipt-total mt-3 pt-3">
                    <span>Subtotal</span>
                    <strong>{formatCurrency(totals.subTotal)}</strong>
                </div>

                {/* Tag: Totals - Delivery */}
                {totals.deliveryFee > 0 && (
                    <div className="receipt-total mt-2 pt-2">
                        <span>Delivery Fee</span>
                        <strong>{formatCurrency(totals.deliveryFee)}</strong>
                    </div>
                )}

                {/* Tag: Totals - Grand Total */}
                <div className="receipt-total mt-2 pt-2">
                    <span>Grand Total</span>
                    <strong>{formatCurrency(totals.orderTotal)}</strong>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderReceiptModal;
