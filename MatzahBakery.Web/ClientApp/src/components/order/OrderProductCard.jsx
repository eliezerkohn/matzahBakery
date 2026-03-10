import { sortTypesWithRegularFirst } from '../../utils/sorters';

const OrderProductCard = ({ product, typeQuantities, getLineKey, updateTypeQuantity, formatCurrency }) => {
    const productBasePrice = Number(product.productPrice) || 0;
    const sortedTypes = sortTypesWithRegularFirst(product.types || []);

    return (
        <div className="card order-card">
            <div className="card-body">
                <div className="d-flex justify-content-between flex-wrap gap-2 mb-3">
                    <div>
                        <div className="fw-semibold">{product.productName || 'Product'}</div>
                        <div className="small text-muted">Base price: {formatCurrency(productBasePrice)}</div>
                    </div>
                </div>

                {!sortedTypes.length && (
                    <div className="text-muted">No types available for this product.</div>
                )}

                {!!sortedTypes.length && (
                    <>
                    <div className="d-grid gap-2 d-sm-none">
                        {sortedTypes.map((type) => {
                            const key = getLineKey(product.productId, type.productTypeId);
                            const rawQuantity = typeQuantities[key];
                            const quantity = Number(rawQuantity) || 0;
                            const inputValue = rawQuantity === '' ? '' : quantity;
                            const typePrice = Number(type.typePrice) || 0;
                            const unitPrice = productBasePrice + typePrice;
                            const lineTotal = unitPrice * quantity;

                            return (
                                <div key={key} className="order-type-mobile-row">
                                    <div className="order-type-mobile-row__name">{type.productTypeName || '-'}</div>
                                    <div className="order-type-mobile-row__meta">Type Price: {formatCurrency(typePrice)}</div>
                                    <div className="order-type-mobile-row__meta">Unit Price: {formatCurrency(unitPrice)}</div>
                                    <div className="order-type-mobile-row__controls">
                                        <label htmlFor={`qty-${key}`} className="small text-muted mb-0">Qty</label>
                                        <input
                                            id={`qty-${key}`}
                                            type="number"
                                            min="0"
                                            className="form-control form-control-sm order-types-table__qty-input"
                                            value={inputValue}
                                            onFocus={() => {
                                                if (quantity === 0 && rawQuantity !== '') {
                                                    updateTypeQuantity(product.productId, type.productTypeId, '');
                                                }
                                            }}
                                            onChange={(event) =>
                                                updateTypeQuantity(product.productId, type.productTypeId, event.target.value)
                                            }
                                            onBlur={(event) => {
                                                if (event.target.value === '') {
                                                    updateTypeQuantity(product.productId, type.productTypeId, '0');
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="order-type-mobile-row__total">
                                        <span className="text-muted">Line Total</span>
                                        <strong>{formatCurrency(lineTotal)}</strong>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="table-responsive d-none d-sm-block">
                        <table className="table table-sm align-middle mb-0 order-types-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Type Price</th>
                                    <th>Unit Price</th>
                                    <th style={{ width: '84px' }}>Qty</th>
                                    <th>Line Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTypes.map((type) => {
                                    const key = getLineKey(product.productId, type.productTypeId);
                                    const rawQuantity = typeQuantities[key];
                                    const quantity = Number(rawQuantity) || 0;
                                    const inputValue = rawQuantity === '' ? '' : quantity;
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
                                                    className="form-control form-control-sm order-types-table__qty-input"
                                                    value={inputValue}
                                                    onFocus={() => {
                                                        if (quantity === 0 && rawQuantity !== '') {
                                                            updateTypeQuantity(product.productId, type.productTypeId, '');
                                                        }
                                                    }}
                                                    onChange={(event) =>
                                                        updateTypeQuantity(product.productId, type.productTypeId, event.target.value)
                                                    }
                                                    onBlur={(event) => {
                                                        if (event.target.value === '') {
                                                            updateTypeQuantity(product.productId, type.productTypeId, '0');
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td>{formatCurrency(lineTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderProductCard;
