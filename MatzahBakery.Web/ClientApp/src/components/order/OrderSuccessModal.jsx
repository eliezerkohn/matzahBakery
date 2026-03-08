const OrderSuccessModal = ({ show, isEditingOrder, submittedOrderId, onClose, onBackHome }) => {
    if (!show) {
        return null;
    }

    return (
        <div className="order-success-overlay" role="dialog" aria-modal="true" aria-label="Order submitted">
            <div className="order-success-modal">
                <h2 className="h5 mb-2">{isEditingOrder ? 'Order Updated' : 'Order Received'}</h2>
                <p className="mb-2">
                    {isEditingOrder
                        ? 'Your order was updated successfully. You will get an email shortly with the updates.'
                        : 'We got the order and we will send you a receipt by email. Thank you.'}
                </p>
                {submittedOrderId && <div className="small text-muted mb-3">Order #{submittedOrderId}</div>}
                <div className="d-flex gap-2 justify-content-end">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={onClose}
                    >
                        Close
                    </button>
                    <button type="button" className="btn btn-dark" onClick={onBackHome}>
                        Back Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessModal;
