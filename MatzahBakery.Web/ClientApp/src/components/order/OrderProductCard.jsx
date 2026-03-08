const OrderProductCard = ({ product, typeQuantities, getLineKey, updateTypeQuantity, formatCurrency }) => {
    const productBasePrice = Number(product.productPrice) || 0;

    return (
        <div className="card order-card">
            <div className="card-body">
                <div className="d-flex justify-content-between flex-wrap gap-2 mb-3">
                    <div>
                        <div className="fw-semibold">{product.productName || 'Product'}</div>
                        <div className="small text-muted">Base price: {formatCurrency(productBasePrice)}</div>
                    </div>
                </div>

                {!(product.types || []).length && (
                    <div className="text-muted">No types available for this product.</div>
                )}

                {!!(product.types || []).length && (
                    <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0 order-types-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Type Price</th>
                                    <th>Unit Price</th>
                                    <th style={{ maxWidth: '110px' }}>Qty</th>
                                    <th>Line Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(product.types || []).map((type) => {
                                    const key = getLineKey(product.productId, type.productTypeId);
                                    const quantity = Number(typeQuantities[key]) || 0;
                                    const typePrice = Number(type.typePrice) || 0;
                                    const unitPrice = productBasePrice + typePrice;
                                    const lineTotal = unitPrice * quantity;

                                    return (
                                        <tr key={key}>
                                            <td>{type.productTypeName || '-'}</td>
                                            <td>{formatCurrency(typePrice)}</td>
                                            <td>{formatCurrency(unitPrice)}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="form-control form-control-sm"
                                                    value={quantity}
                                                    onChange={(event) =>
                                                        updateTypeQuantity(product.productId, type.productTypeId, event.target.value)
                                                    }
                                                />
                                            </td>
                                            <td>{formatCurrency(lineTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderProductCard;
