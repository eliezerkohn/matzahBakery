import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import OrderProductCard from '../components/order/OrderProductCard';
import OrderReceiptPanel from '../components/order/OrderReceiptPanel';
import GuestLoginModal from '../components/order/GuestLoginModal';
import OrderSuccessModal from '../components/order/OrderSuccessModal';
import { formatCurrency } from '../utils/formatters';
import { DELIVERY_FEE } from '../utils/constants';
import { isValidPhoneDigits, normalizePhoneDigits, safeTrim, toPositiveInt } from '../utils/security';

const getLineKey = (productId, productTypeId) => `${productId}:${productTypeId}`;
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
    // Tag: Navigation and route context
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const prefillOrder = location.state?.prefillOrder || null;
    const editingOrderId = Number(prefillOrder?.orderId) || 0;
    const isEditingOrder = editingOrderId > 0;
    const guestMode = searchParams.get('guest') === '1' || Boolean(location.state?.guestMode);

    // Tag: Page state
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

    // Tag: Guest auth modal state
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

    // Tag: Initial data and prefill
    useEffect(() => {
        const loadPageData = async () => {
            setLoading(true);
            try {
                const customerId = toPositiveInt(searchParams.get('customerId'));
                const requests = [axios.get('/api/products')];

                if (!customer && customerId > 0) {
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

    // Tag: Derived values
    const isCustomerComplete = useMemo(
        () => requiredCustomerFields.every((field) => Boolean(String(customer?.[field] || '').trim())),
        [customer]
    );

    const isGuestRegistrationComplete = useMemo(
        () => requiredCustomerFields.every((field) => Boolean(String(guestRegistrationForm?.[field] || '').trim())),
        [guestRegistrationForm]
    );

    const canShowViewOrders = !guestMode || isCustomerComplete;
    const todayIso = new Date().toISOString().slice(0, 10);

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
    const orderTotal = subTotal + deliveryFee;
    const deliveryAddressForOrder = useAccountAddress ? getCustomerAddress() : customDeliveryAddress.trim();
    const totalItemCount = useMemo(
        () => selectedLines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0),
        [selectedLines]
    );

    // Tag: Actions
    const updateTypeQuantity = (productId, productTypeId, value) => {
        const key = getLineKey(productId, productTypeId);

        if (value === '') {
            setTypeQuantities((prev) => ({
                ...prev,
                [key]: ''
            }));
            return;
        }

        const parsedQuantity = Math.max(0, Number(value) || 0);
        setTypeQuantities((prev) => ({
            ...prev,
            [key]: parsedQuantity
        }));
    };

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
        if (!toPositiveInt(currentCustomerId)) {
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
            customerId: toPositiveInt(currentCustomerId),
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
            if (editingOrderId > 0) {
                await axios.put(`/api/orders/${editingOrderId}`, payload);
                setSubmittedOrderId(editingOrderId);
            } else {
                const response = await axios.post('/api/orders', payload);
                setSubmittedOrderId(response?.data?.orderId ?? null);
            }

            setShowSuccessPopup(true);
            setSubmitState({ loading: false, message: '', isError: false });
        } catch {
            setSubmitState({
                loading: false,
                message: editingOrderId > 0
                    ? 'Could not update order in backend API.'
                    : 'Could not submit order to backend API.',
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
        const cleanedPhone = normalizePhoneDigits(guestPhoneNumber);
        if (!cleanedPhone) {
            setGuestAuthMessage('Enter a phone number to continue.');
            return;
        }

        if (!isValidPhoneDigits(cleanedPhone)) {
            setGuestAuthMessage('Please enter a valid phone number.');
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
            firstName: safeTrim(guestRegistrationForm.firstName),
            lastName: safeTrim(guestRegistrationForm.lastName),
            email: safeTrim(guestRegistrationForm.email, 160),
            phoneNumber: normalizePhoneDigits(guestRegistrationForm.phoneNumber),
            address: safeTrim(guestRegistrationForm.address, 200),
            apartment: safeTrim(guestRegistrationForm.apartment, 60),
            city: safeTrim(guestRegistrationForm.city, 80),
            state: safeTrim(guestRegistrationForm.state, 40),
            zipCode: safeTrim(guestRegistrationForm.zipCode, 20)
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

    const handleViewOrdersClick = () => {
        const customerId = toPositiveInt(getCustomerId());
        if (!customerId) {
            navigate('/admin/orders');
            return;
        }

        const customerName = safeTrim(`${customer?.firstName || ''} ${customer?.lastName || ''}`, 120);
        const query = new URLSearchParams({ customerId: String(customerId) });
        if (customerName) {
            query.set('customerName', customerName);
        }

        navigate(`/admin/orders?${query.toString()}`);
    };

    if (loading) {
        return <div className="container py-5">Loading order page...</div>;
    }

    return (
        <div className="order-page container-fluid px-3 px-lg-4 py-4 py-lg-5">
            <div className="order-page__heading mb-4">
                <h1 className="order-title mb-1">{isEditingOrder ? `Updating order #${editingOrderId}` : 'Build Order'}</h1>
                <p className="page-subtitle mb-0">
                    {isEditingOrder
                        ? 'Adjust quantities, fulfillment, or delivery details before saving.'
                        : 'Select product types and quantities, then review totals before submitting.'}
                </p>
            </div>

            {!isCustomerComplete && !guestMode && (
                <div className="alert alert-warning">
                    {'Customer information is missing. Go back to Home and complete customer details first.'}
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
                                    {' | '}
                                    {customer.phoneNumber || '-'}
                                    {' | '}
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
                                    min={todayIso}
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

                        {catalog.map((product) => (
                            <OrderProductCard
                                key={product.productId}
                                product={product}
                                typeQuantities={typeQuantities}
                                getLineKey={getLineKey}
                                updateTypeQuantity={updateTypeQuantity}
                                formatCurrency={formatCurrency}
                            />
                        ))}

                        <div className="d-flex gap-2 align-items-center flex-wrap">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/')}>
                                Back Home
                            </button>
                            <button
                                type="submit"
                                className="btn btn-dark"
                                disabled={submitState.loading || !catalog.length || !selectedLines.length}
                            >
                                {submitState.loading
                                    ? (isEditingOrder ? 'Updating...' : 'Submitting...')
                                    : (isEditingOrder ? 'Update Order' : 'Submit Order')}
                            </button>
                            {!selectedLines.length && !submitState.loading && (
                                <span className="small text-muted">Add at least one item to submit.</span>
                            )}
                            {submitState.message && (
                                <span className={submitState.isError ? 'text-danger' : 'text-success'}>{submitState.message}</span>
                            )}
                        </div>
                    </form>
                </div>

                <OrderReceiptPanel
                    canShowViewOrders={canShowViewOrders}
                    onViewOrders={handleViewOrdersClick}
                    fulfillmentType={fulfillmentType}
                    fulfillmentDate={fulfillmentDate}
                    customer={customer}
                    totalItemCount={totalItemCount}
                    deliveryAddressForOrder={deliveryAddressForOrder}
                    selectedLines={selectedLines}
                    getLineKey={getLineKey}
                    formatCurrency={formatCurrency}
                    subTotal={subTotal}
                    deliveryFee={deliveryFee}
                    orderTotal={orderTotal}
                />
            </div>

            <GuestLoginModal
                show={showGuestLoginPopup}
                guestNeedsRegistration={guestNeedsRegistration}
                guestPhoneNumber={guestPhoneNumber}
                onPhoneChange={setGuestPhoneNumber}
                onFindAccount={handleGuestPhoneLookup}
                guestAuthLoading={guestAuthLoading}
                guestRegistrationForm={guestRegistrationForm}
                onRegistrationChange={handleGuestRegistrationChange}
                guestAuthMessage={guestAuthMessage}
                onClose={() => {
                    setShowGuestLoginPopup(false);
                    setGuestNeedsRegistration(false);
                    setGuestAuthMessage('');
                }}
                onCreateAccount={handleCreateGuestAccount}
            />

            <OrderSuccessModal
                show={showSuccessPopup}
                isEditingOrder={isEditingOrder}
                submittedOrderId={submittedOrderId}
                onClose={() => {
                    setShowSuccessPopup(false);
                    if (!isEditingOrder) {
                        resetOrderInputs();
                    }
                }}
                onBackHome={() => navigate(isEditingOrder ? '/admin/orders' : '/')}
            />
        </div>
    );
};

export default Order;

