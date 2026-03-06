import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const getLineKey = (productId, productTypeId) => `${productId}:${productTypeId}`;
const DELIVERY_FEE = 25;
const TAX_RATE = 0.08875;
const requiredCustomerFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'address', 'city', 'state', 'zipCode'];

const emptyGuestRegistrationForm = {
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

const Order = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const prefillOrder = location.state?.prefillOrder || null;
    const guestMode = searchParams.get('guest') === '1' || Boolean(location.state?.guestMode);

    const [customer, setCustomer] = useState(location.state?.customer || null);
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);

    const [fulfillmentDate, setFulfillmentDate] = useState(new Date().toISOString().slice(0, 10));
    const [fulfillmentType, setFulfillmentType] = useState('pickup');
    const [useAccountAddress, setUseAccountAddress] = useState(true);
    const [customDeliveryAddress, setCustomDeliveryAddress] = useState('');
    const [typeQuantities, setTypeQuantities] = useState({});
    const [submitState, setSubmitState] = useState({ loading: false, message: '', isError: false });
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [submittedOrderId, setSubmittedOrderId] = useState(null);
    const [showGuestLoginPopup, setShowGuestLoginPopup] = useState(false);
    const [guestPhoneNumber, setGuestPhoneNumber] = useState('');
    const [guestNeedsRegistration, setGuestNeedsRegistration] = useState(false);
    const [guestRegistrationForm, setGuestRegistrationForm] = useState(emptyGuestRegistrationForm);
    const [guestAuthLoading, setGuestAuthLoading] = useState(false);
    const [guestAuthMessage, setGuestAuthMessage] = useState('');

    const getCustomerIdFrom = (value) => value?.customerId || value?.id;

    const buildCustomerAddress = (value) => {
        const addressParts = [value?.address, value?.apartment, value?.city, value?.state, value?.zipCode]
            .filter((part) => Boolean(String(part || '').trim()))
            .map((part) => String(part).trim());

        return addressParts.join(', ');
    };

    const getCustomerId = () => getCustomerIdFrom(customer);
    const getCustomerAddress = () => buildCustomerAddress(customer);

    useEffect(() => {
        const loadPageData = async () => {
            setLoading(true);
            try {
                const customerId = searchParams.get('customerId');
                const requests = [axios.get('/api/products')];

                if (!customer && customerId) {
                    requests.push(axios.get(`/api/customers/${customerId}`));
                }

                const responses = await Promise.all(requests);
                const productsResponse = responses[0];
                const products = Array.isArray(productsResponse.data) ? productsResponse.data : [];
                setCatalog(products);

                const initialQuantities = {};
                products.forEach((product) => {
                    (product.types || []).forEach((type) => {
                        initialQuantities[getLineKey(product.productId, type.productTypeId)] = 0;
                    });
                });

                if (prefillOrder?.orderLines?.length) {
                    prefillOrder.orderLines.forEach((line) => {
                        const key = getLineKey(line.productId, line.productTypeId);
                        if (Object.prototype.hasOwnProperty.call(initialQuantities, key)) {
                            initialQuantities[key] = Math.max(0, Number(line.quantity) || 0);
                        }
                    });

                    if (prefillOrder.orderDate) {
                        setFulfillmentDate(String(prefillOrder.orderDate).slice(0, 10));
                    }

                    const prefillType = String(prefillOrder.fulfillmentType || '').toLowerCase();
                    if (prefillType === 'delivery' || prefillType === 'pickup') {
                        setFulfillmentType(prefillType);
                    }

                    if (prefillType === 'delivery' && prefillOrder.deliveryAddress) {
                        setUseAccountAddress(false);
                        setCustomDeliveryAddress(String(prefillOrder.deliveryAddress));
                    }
                }

                setTypeQuantities(initialQuantities);

                if (!customer && responses[1]?.data) {
                    setCustomer(responses[1].data);
                }
            } catch {
                setSubmitState({
                    loading: false,
                    message: 'Could not load customer/products from backend API.',
                    isError: true
                });
            } finally {
                setLoading(false);
            }
        };

        loadPageData();
    }, [searchParams, prefillOrder]);

    const isCustomerComplete = useMemo(
        () => requiredCustomerFields.every((field) => Boolean(String(customer?.[field] || '').trim())),
        [customer]
    );

    const isGuestRegistrationComplete = useMemo(
        () => requiredCustomerFields.every((field) => Boolean(String(guestRegistrationForm?.[field] || '').trim())),
        [guestRegistrationForm]
    );

    const updateTypeQuantity = (productId, productTypeId, value) => {
        const key = getLineKey(productId, productTypeId);
        const parsedQuantity = Math.max(0, Number(value) || 0);
        setTypeQuantities((prev) => ({
            ...prev,
            [key]: parsedQuantity
        }));
    };

    const selectedLines = useMemo(() => {
        const lines = [];

        catalog.forEach((product) => {
            (product.types || []).forEach((type) => {
                const quantity = Number(typeQuantities[getLineKey(product.productId, type.productTypeId)]) || 0;
                if (quantity <= 0) {
                    return;
                }

                const basePrice = Number(product?.productPrice) || 0;
                const typePrice = Number(type?.typePrice) || 0;
                const unitPrice = basePrice + typePrice;

                lines.push({
                    productId: product.productId,
                    productTypeId: type.productTypeId,
                    productName: product?.productName || '',
                    productTypeName: type?.productTypeName || '',
                    quantity,
                    unitPrice,
                    lineTotal: unitPrice * quantity
                });
            });
        });

        return lines;
    }, [catalog, typeQuantities]);

    const subTotal = useMemo(() => selectedLines.reduce((sum, line) => sum + line.lineTotal, 0), [selectedLines]);
    const deliveryFee = fulfillmentType === 'delivery' ? DELIVERY_FEE : 0;
    const taxAmount = subTotal * TAX_RATE;
    const orderTotal = subTotal + taxAmount + deliveryFee;
    const deliveryAddressForOrder = useAccountAddress ? getCustomerAddress() : customDeliveryAddress.trim();
    const totalItemCount = useMemo(
        () => selectedLines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0),
        [selectedLines]
    );

    const resetOrderInputs = () => {
        const resetQuantities = {};
        catalog.forEach((product) => {
            (product.types || []).forEach((type) => {
                resetQuantities[getLineKey(product.productId, type.productTypeId)] = 0;
            });
        });

        setFulfillmentDate(new Date().toISOString().slice(0, 10));
        setFulfillmentType('pickup');
        setUseAccountAddress(true);
        setCustomDeliveryAddress('');
        setTypeQuantities(resetQuantities);
        setSubmitState({ loading: false, message: '', isError: false });
        setSubmittedOrderId(null);
    };

    const submitOrder = async (customerData) => {
        if (!selectedLines.length) {
            setSubmitState({
                loading: false,
                message: 'Select at least one product type and quantity before submitting.',
                isError: true
            });
            return;
        }

        const currentCustomerId = getCustomerIdFrom(customerData);
        if (!currentCustomerId) {
            setSubmitState({
                loading: false,
                message: 'Please log in before submitting your order.',
                isError: true
            });
            return;
        }

        const customerAddress = buildCustomerAddress(customerData);
        const resolvedDeliveryAddress = useAccountAddress ? customerAddress : customDeliveryAddress.trim();

        if (fulfillmentType === 'delivery' && !resolvedDeliveryAddress) {
            setSubmitState({
                loading: false,
                message: 'Enter a delivery address or use the account address.',
                isError: true
            });
            return;
        }

        setSubmitState({ loading: true, message: '', isError: false });

        const payload = {
            orderDate: fulfillmentDate,
            customerId: currentCustomerId,
            fulfillmentType,
            deliveryAddress: fulfillmentType === 'delivery' ? resolvedDeliveryAddress : '',
            orderTotal,
            orderLines: selectedLines.map((line) => ({
                productId: line.productId,
                productTypeId: line.productTypeId,
                quantity: Number(line.quantity) || 0
            }))
        };

        try {
            const response = await axios.post('/api/orders', payload);
            setSubmittedOrderId(response?.data?.orderId ?? null);
            setShowSuccessPopup(true);
            setSubmitState({ loading: false, message: '', isError: false });
        } catch {
            setSubmitState({
                loading: false,
                message: 'Could not submit order to backend API.',
                isError: true
            });
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!isCustomerComplete) {
            setShowGuestLoginPopup(true);
            setGuestAuthMessage('Log in or create an account to submit your order.');
            return;
        }

        await submitOrder(customer);
    };

    const handleGuestPhoneLookup = async () => {
        const cleanedPhone = guestPhoneNumber.replace(/\D/g, '');
        if (!cleanedPhone) {
            setGuestAuthMessage('Enter a phone number to continue.');
            return;
        }

        setGuestAuthLoading(true);
        setGuestAuthMessage('');

        try {
            const response = await axios.get('/api/customers/varify', {
                params: { phone: cleanedPhone }
            });

            const foundCustomer = response.data;
            if (getCustomerIdFrom(foundCustomer)) {
                setCustomer(foundCustomer);
                setShowGuestLoginPopup(false);
                setGuestNeedsRegistration(false);
                setGuestRegistrationForm(emptyGuestRegistrationForm);
                setGuestAuthMessage('');
                setSubmitState({
                    loading: false,
                    message: 'Logged in successfully. Click Submit Order again to place your order.',
                    isError: false
                });
                return;
            }

            setGuestNeedsRegistration(true);
            setGuestRegistrationForm((prev) => ({ ...prev, phoneNumber: cleanedPhone }));
            setGuestAuthMessage('No customer found. Complete the form to create an account.');
        } catch {
            setGuestAuthMessage('Could not verify phone number right now. Please try again.');
        } finally {
            setGuestAuthLoading(false);
        }
    };

    const handleGuestRegistrationChange = (event) => {
        const { name, value } = event.target;
        setGuestRegistrationForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateGuestAccount = async () => {
        if (!isGuestRegistrationComplete) {
            setGuestAuthMessage('Please complete all required fields.');
            return;
        }

        setGuestAuthLoading(true);
        setGuestAuthMessage('');

        const payload = {
            firstName: guestRegistrationForm.firstName.trim(),
            lastName: guestRegistrationForm.lastName.trim(),
            email: guestRegistrationForm.email.trim(),
            phoneNumber: guestRegistrationForm.phoneNumber.replace(/\D/g, ''),
            address: guestRegistrationForm.address.trim(),
            apartment: guestRegistrationForm.apartment.trim(),
            city: guestRegistrationForm.city.trim(),
            state: guestRegistrationForm.state.trim(),
            zipCode: guestRegistrationForm.zipCode.trim()
        };

        try {
            const response = await axios.post('/api/customers/add', payload);
            const createdCustomer = response.data || payload;
            setCustomer(createdCustomer);
            setShowGuestLoginPopup(false);
            setGuestNeedsRegistration(false);
            setGuestRegistrationForm(emptyGuestRegistrationForm);
            setGuestPhoneNumber('');
            setGuestAuthMessage('');
            setSubmitState({
                loading: false,
                message: 'Account created. Click Submit Order again to place your order.',
                isError: false
            });
        } catch (error) {
            setGuestAuthMessage(error?.response?.data?.message || 'Could not create account. Please try again.');
        } finally {
            setGuestAuthLoading(false);
        }
    };

    if (loading) {
        return <div className="container py-5">Loading order page...</div>;
    }

    return (
        <div className="order-page container-fluid px-3 px-lg-4 py-4 py-lg-5">
            <div className="order-page__heading mb-4">
                <h1 className="order-title mb-1">Build Order</h1>
            </div>

            {!isCustomerComplete && (
                <div className="alert alert-warning">
                    {guestMode
                        ? 'Guest checkout enabled. Submit your order to log in or create an account.'
                        : 'Customer information is missing. Go back to Home and complete customer details first.'}
                </div>
            )}

            <div className="order-layout-grid">
                <div className="order-builder-column">
                    {customer && (
                        <div className="card order-card mb-4">
                                                        <div className="card-body py-2 px-3 customer-summary">
                                                                <div className="customer-summary__title">Customer</div>
                                                                <div className="customer-summary__line">
                                                                        {`${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '-'}
                                                                        {' • '}
                                                                        {customer.phoneNumber || '-'}
                                                                        {' • '}
                                                                        {customer.email || '-'}
                                                                </div>
                                                                <div className="customer-summary__line customer-summary__address">
                                                                        {getCustomerAddress() || '-'}
                                                                </div>
                                                        </div>
                        </div>
                    )}

                    <form className="d-grid gap-4" onSubmit={handleSubmit}>
                        <div className="card order-card">
                            <div className="card-body">
                                <label className="form-label mb-1">Fulfillment Type</label>
                                <select
                                    className="form-select mb-3"
                                    value={fulfillmentType}
                                    onChange={(event) => setFulfillmentType(event.target.value)}
                                >
                                    <option value="pickup">Pickup</option>
                                    <option value="delivery">Delivery (+{formatCurrency(DELIVERY_FEE)})</option>
                                </select>

                                <label className="form-label mb-1">{fulfillmentType === 'delivery' ? 'Delivery Date' : 'Pickup Date'}</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={fulfillmentDate}
                                    onChange={(event) => setFulfillmentDate(event.target.value)}
                                />

                                {fulfillmentType === 'delivery' && (
                                    <div className="mt-3">
                                        <label className="form-label mb-1">Delivery Address</label>
                                        <div className="form-check mb-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="use-account-address"
                                                checked={useAccountAddress}
                                                onChange={(event) => setUseAccountAddress(event.target.checked)}
                                            />
                                            <label className="form-check-label" htmlFor="use-account-address">
                                                Use address from account
                                            </label>
                                        </div>

                                        {useAccountAddress ? (
                                            <div className="small text-muted border rounded p-2 bg-light">
                                                {getCustomerAddress() || 'No account address found.'}
                                            </div>
                                        ) : (
                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                placeholder="Enter delivery address"
                                                value={customDeliveryAddress}
                                                onChange={(event) => setCustomDeliveryAddress(event.target.value)}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {catalog.map((product) => {
                            const productBasePrice = Number(product.productPrice) || 0;

                            return (
                                <div key={product.productId} className="card order-card">
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
                        })}

                        <div className="d-flex gap-2 align-items-center">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/')}>
                                Back Home
                            </button>
                            <button type="submit" className="btn btn-dark" disabled={submitState.loading || !catalog.length}>
                                {submitState.loading ? 'Submitting...' : 'Submit Order'}
                            </button>
                            {submitState.message && (
                                <span className={submitState.isError ? 'text-danger' : 'text-success'}>{submitState.message}</span>
                            )}
                        </div>
                    </form>
                </div>

                <aside className="order-receipt-column">
                    <div className="card order-card order-view-orders-card mb-2">
                        <div className="card-body order-view-orders-body d-flex justify-content-between align-items-center gap-2">
                            <div className="text-muted order-view-orders-text">Need past orders?</div>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-dark order-view-orders-btn"
                                onClick={() => {
                                    const customerId = getCustomerId();
                                    navigate(customerId ? `/admin/orders?customerId=${customerId}` : '/admin/orders');
                                }}
                            >
                                View Orders
                            </button>
                        </div>
                    </div>

                    <div className="card order-receipt-card">
                        <div className="card-body">
                            <h2 className="h5 mb-1">Receipt</h2>
                            <small className="text-muted" style={{ display: "block", marginBottom: "10px" }}>Review your order details here as you build.</small>

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

                            <div className="receipt-total mt-2 pt-2">
                                <span>Tax (8.875%)</span>
                                <strong>{formatCurrency(taxAmount)}</strong>
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
            </div>

            {showGuestLoginPopup && (
                <div className="order-success-overlay" role="dialog" aria-modal="true" aria-label="Log in to submit order">
                    <div className="order-success-modal">
                        <h2 className="h5 mb-2">Log In To Submit Order</h2>
                        <p className="mb-3">Enter your phone number to find your account, or create a new one.</p>

                        <div className="mb-3">
                            <label className="form-label">Phone Number</label>
                            <input
                                className="form-control"
                                value={guestPhoneNumber}
                                onChange={(event) => setGuestPhoneNumber(event.target.value.replace(/\D/g, ''))}
                                inputMode="numeric"
                                pattern="[0-9]*"
                            />
                        </div>

                        {!guestNeedsRegistration && (
                            <div className="mb-3 d-flex gap-2 justify-content-end">
                                <button
                                    type="button"
                                    className="btn btn-dark"
                                    onClick={handleGuestPhoneLookup}
                                    disabled={guestAuthLoading}
                                >
                                    {guestAuthLoading ? 'Checking...' : 'Find Account'}
                                </button>
                            </div>
                        )}

                        {guestNeedsRegistration && (
                            <div className="row g-2 mb-3">
                                <div className="col-12 col-md-6">
                                    <input
                                        className="form-control"
                                        name="firstName"
                                        placeholder="First Name"
                                        value={guestRegistrationForm.firstName}
                                        onChange={handleGuestRegistrationChange}
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <input
                                        className="form-control"
                                        name="lastName"
                                        placeholder="Last Name"
                                        value={guestRegistrationForm.lastName}
                                        onChange={handleGuestRegistrationChange}
                                    />
                                </div>
                                <div className="col-12">
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        placeholder="Email"
                                        value={guestRegistrationForm.email}
                                        onChange={handleGuestRegistrationChange}
                                    />
                                </div>
                                <div className="col-12">
                                    <input
                                        className="form-control"
                                        name="address"
                                        placeholder="Address"
                                        value={guestRegistrationForm.address}
                                        onChange={handleGuestRegistrationChange}
                                    />
                                </div>
                                <div className="col-12 col-md-4">
                                    <input
                                        className="form-control"
                                        name="apartment"
                                        placeholder="Apartment (Optional)"
                                        value={guestRegistrationForm.apartment}
                                        onChange={handleGuestRegistrationChange}
                                    />
                                </div>
                                <div className="col-12 col-md-3">
                                    <input
                                        className="form-control"
                                        name="city"
                                        placeholder="City"
                                        value={guestRegistrationForm.city}
                                        onChange={handleGuestRegistrationChange}
                                    />
                                </div>
                                <div className="col-12 col-md-3">
                                    <input
                                        className="form-control"
                                        name="state"
                                        placeholder="State"
                                        value={guestRegistrationForm.state}
                                        onChange={handleGuestRegistrationChange}
                                    />
                                </div>
                                <div className="col-12 col-md-2">
                                    <input
                                        className="form-control"
                                        name="zipCode"
                                        placeholder="Zip"
                                        value={guestRegistrationForm.zipCode}
                                        onChange={handleGuestRegistrationChange}
                                    />
                                </div>
                            </div>
                        )}

                        {guestAuthMessage && <div className="text-danger mb-3">{guestAuthMessage}</div>}

                        <div className="d-flex gap-2 justify-content-end">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                    setShowGuestLoginPopup(false);
                                    setGuestNeedsRegistration(false);
                                    setGuestAuthMessage('');
                                }}
                            >
                                Close
                            </button>
                            {guestNeedsRegistration && (
                                <button
                                    type="button"
                                    className="btn btn-dark"
                                    onClick={handleCreateGuestAccount}
                                    disabled={guestAuthLoading}
                                >
                                    {guestAuthLoading ? 'Creating...' : 'Create Account & Submit'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showSuccessPopup && (
                <div className="order-success-overlay" role="dialog" aria-modal="true" aria-label="Order submitted">
                    <div className="order-success-modal">
                        <h2 className="h5 mb-2">Order Received</h2>
                        <p className="mb-2">We got the order and we will send you a receipt by email. Thank you.</p>
                        {submittedOrderId && <div className="small text-muted mb-3">Order #{submittedOrderId}</div>}
                        <div className="d-flex gap-2 justify-content-end">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                    setShowSuccessPopup(false);
                                    resetOrderInputs();
                                }}
                            >
                                Close
                            </button>
                            <button type="button" className="btn btn-dark" onClick={() => navigate('/')}>
                                Back Home
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Order;
