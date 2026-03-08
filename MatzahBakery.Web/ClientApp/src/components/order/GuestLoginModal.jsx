const GuestLoginModal = ({
    show,
    guestNeedsRegistration,
    guestPhoneNumber,
    onPhoneChange,
    onFindAccount,
    guestAuthLoading,
    guestRegistrationForm,
    onRegistrationChange,
    guestAuthMessage,
    onClose,
    onCreateAccount
}) => {
    if (!show) {
        return null;
    }

    return (
        <div className="order-success-overlay" role="dialog" aria-modal="true" aria-label="Log in to submit order">
            <div className="order-success-modal">
                <h2 className="h5 mb-2">Log In To Submit Order</h2>
                <p className="mb-3">Enter your phone number to find your account, or create a new one.</p>

                <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                        className="form-control"
                        value={guestPhoneNumber}
                        onChange={(event) => onPhoneChange(event.target.value.replace(/\D/g, ''))}
                        inputMode="numeric"
                        pattern="[0-9]*"
                    />
                </div>

                {!guestNeedsRegistration && (
                    <div className="mb-3 d-flex gap-2 justify-content-end">
                        <button
                            type="button"
                            className="btn btn-dark"
                            onClick={onFindAccount}
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
                                onChange={onRegistrationChange}
                            />
                        </div>
                        <div className="col-12 col-md-6">
                            <input
                                className="form-control"
                                name="lastName"
                                placeholder="Last Name"
                                value={guestRegistrationForm.lastName}
                                onChange={onRegistrationChange}
                            />
                        </div>
                        <div className="col-12">
                            <input
                                type="email"
                                className="form-control"
                                name="email"
                                placeholder="Email"
                                value={guestRegistrationForm.email}
                                onChange={onRegistrationChange}
                            />
                        </div>
                        <div className="col-12">
                            <input
                                className="form-control"
                                name="address"
                                placeholder="Address"
                                value={guestRegistrationForm.address}
                                onChange={onRegistrationChange}
                            />
                        </div>
                        <div className="col-12 col-md-4">
                            <input
                                className="form-control"
                                name="apartment"
                                placeholder="Apartment (Optional)"
                                value={guestRegistrationForm.apartment}
                                onChange={onRegistrationChange}
                            />
                        </div>
                        <div className="col-12 col-md-3">
                            <input
                                className="form-control"
                                name="city"
                                placeholder="City"
                                value={guestRegistrationForm.city}
                                onChange={onRegistrationChange}
                            />
                        </div>
                        <div className="col-12 col-md-3">
                            <input
                                className="form-control"
                                name="state"
                                placeholder="State"
                                value={guestRegistrationForm.state}
                                onChange={onRegistrationChange}
                            />
                        </div>
                        <div className="col-12 col-md-2">
                            <input
                                className="form-control"
                                name="zipCode"
                                placeholder="Zip"
                                value={guestRegistrationForm.zipCode}
                                onChange={onRegistrationChange}
                            />
                        </div>
                    </div>
                )}

                {guestAuthMessage && <div className="text-danger mb-3">{guestAuthMessage}</div>}

                <div className="d-flex gap-2 justify-content-end">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={onClose}
                    >
                        Close
                    </button>
                    {guestNeedsRegistration && (
                        <button
                            type="button"
                            className="btn btn-dark"
                            onClick={onCreateAccount}
                            disabled={guestAuthLoading}
                        >
                            {guestAuthLoading ? 'Creating...' : 'Create Account & Submit'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuestLoginModal;
