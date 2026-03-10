const AdminCustomersTable = ({
    filteredCustomers,
    editingCustomerId,
    editForm,
    onEditFormChange,
    onStartEdit,
    onSaveCustomer,
    onCancelEdit,
    onDeleteCustomer,
    onAddOrderForCustomer,
    onViewCustomerOrders
}) => {
    return (
        <>
            <div className="d-grid gap-3 d-lg-none">
                {!filteredCustomers.length && <div className="card p-3 text-muted">No customers found.</div>}

                {filteredCustomers.map((customer) => {
                    const isEditing = editingCustomerId === customer.id;
                    const setField = (field, value) => onEditFormChange((prev) => ({ ...prev, [field]: value }));

                    return (
                        <div key={customer.id} className="card admin-mobile-card">
                            <div className="card-body">
                                <div className="admin-mobile-card__title">Customer #{customer.id}</div>

                                <div className="admin-mobile-card__line">
                                    <strong>Name:</strong>{' '}
                                    {isEditing
                                        ? (
                                            <div className="d-grid gap-2 mt-1">
                                                <input className="form-control form-control-sm" value={editForm.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder="First Name" />
                                                <input className="form-control form-control-sm" value={editForm.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder="Last Name" />
                                            </div>
                                        )
                                        : `${customer.firstName || '-'} ${customer.lastName || ''}`.trim()}
                                </div>

                                <div className="admin-mobile-card__line">
                                    <strong>Email:</strong>{' '}
                                    {isEditing
                                        ? <input className="form-control form-control-sm mt-1" value={editForm.email} onChange={(e) => setField('email', e.target.value)} />
                                        : (customer.email || '-')}
                                </div>

                                <div className="admin-mobile-card__line">
                                    <strong>Phone:</strong>{' '}
                                    {isEditing
                                        ? <input className="form-control form-control-sm mt-1" value={editForm.phoneNumber} onChange={(e) => setField('phoneNumber', e.target.value)} />
                                        : (customer.phoneNumber || '-')}
                                </div>

                                <div className="admin-mobile-card__line">
                                    <strong>Address:</strong>{' '}
                                    {isEditing
                                        ? (
                                            <div className="d-grid gap-2 mt-1">
                                                <input className="form-control form-control-sm" value={editForm.address} onChange={(e) => setField('address', e.target.value)} placeholder="Address" />
                                                <input className="form-control form-control-sm" value={editForm.apartment} onChange={(e) => setField('apartment', e.target.value)} placeholder="Apartment" />
                                                <div className="row g-2">
                                                    <div className="col-6">
                                                        <input className="form-control form-control-sm" value={editForm.city} onChange={(e) => setField('city', e.target.value)} placeholder="City" />
                                                    </div>
                                                    <div className="col-3">
                                                        <input className="form-control form-control-sm" value={editForm.state} onChange={(e) => setField('state', e.target.value)} placeholder="State" />
                                                    </div>
                                                    <div className="col-3">
                                                        <input className="form-control form-control-sm" value={editForm.zipCode} onChange={(e) => setField('zipCode', e.target.value)} placeholder="Zip" />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                        : `${customer.address || '-'} ${customer.apartment ? `, ${customer.apartment}` : ''}, ${customer.city || '-'}, ${customer.state || '-'} ${customer.zipCode || '-'}`}
                                </div>

                                <div className="admin-mobile-card__actions mt-2">
                                    {isEditing ? (
                                        <>
                                            <button type="button" className="btn btn-sm btn-dark" onClick={() => onSaveCustomer(customer.id)}>Save</button>
                                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancelEdit}>Cancel</button>
                                            <button type="button" className="btn btn-sm btn-outline-success" onClick={() => onAddOrderForCustomer(customer.id)}>Add Order</button>
                                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onViewCustomerOrders(customer)}>View Orders</button>
                                        </>
                                    ) : (
                                        <>
                                            <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => onStartEdit(customer)}>Edit</button>
                                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDeleteCustomer(customer.id)}>Delete</button>
                                            <button type="button" className="btn btn-sm btn-outline-success" onClick={() => onAddOrderForCustomer(customer.id)}>Add Order</button>
                                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onViewCustomerOrders(customer)}>View Orders</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tag: Customers Data Table */}
            <div className="table-responsive d-none d-lg-block">
                <table className="table table-striped align-middle">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Apt</th>
                            <th>City</th>
                            <th>State</th>
                            <th>Zip</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Tag: Empty State */}
                        {!filteredCustomers.length && (
                            <tr>
                                <td colSpan={13} className="text-muted">No customers found.</td>
                            </tr>
                        )}

                        {/* Tag: Customer Rows */}
                        {filteredCustomers.map((customer) => {
                            const isEditing = editingCustomerId === customer.id;
                            const setField = (field, value) => onEditFormChange((prev) => ({ ...prev, [field]: value }));

                            return (
                                <tr key={customer.id}>
                                    <td>{customer.id}</td>
                                    <td>{isEditing ? <input className="form-control form-control-sm" value={editForm.firstName} onChange={(e) => setField('firstName', e.target.value)} /> : (customer.firstName || '-')}</td>
                                    <td>{isEditing ? <input className="form-control form-control-sm" value={editForm.lastName} onChange={(e) => setField('lastName', e.target.value)} /> : (customer.lastName || '-')}</td>
                                    <td>{isEditing ? <input className="form-control form-control-sm" value={editForm.email} onChange={(e) => setField('email', e.target.value)} /> : (customer.email || '-')}</td>
                                    <td>{isEditing ? <input className="form-control form-control-sm" value={editForm.phoneNumber} onChange={(e) => setField('phoneNumber', e.target.value)} /> : (customer.phoneNumber || '-')}</td>
                                    <td>{isEditing ? <input className="form-control form-control-sm" value={editForm.address} onChange={(e) => setField('address', e.target.value)} /> : (customer.address || '-')}</td>
                                    <td>{isEditing ? <input className="form-control form-control-sm" value={editForm.apartment} onChange={(e) => setField('apartment', e.target.value)} /> : (customer.apartment || '-')}</td>
                                    <td>{isEditing ? <input className="form-control form-control-sm" value={editForm.city} onChange={(e) => setField('city', e.target.value)} /> : (customer.city || '-')}</td>
                                    <td>{isEditing ? <input className="form-control form-control-sm" value={editForm.state} onChange={(e) => setField('state', e.target.value)} /> : (customer.state || '-')}</td>
                                    <td>{isEditing ? <input className="form-control form-control-sm" value={editForm.zipCode} onChange={(e) => setField('zipCode', e.target.value)} /> : (customer.zipCode || '-')}</td>
                                    <td>
                                        {/* Tag: Row Actions */}
                                        {isEditing ? (
                                            <div className="d-flex gap-2">
                                                <button type="button" className="btn btn-sm btn-dark" onClick={() => onSaveCustomer(customer.id)}>Save</button>
                                                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancelEdit}>Cancel</button>
                                                <button type="button" className="btn btn-sm btn-outline-success" onClick={() => onAddOrderForCustomer(customer.id)}>Add Order</button>
                                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onViewCustomerOrders(customer)}>View Orders</button>
                                            </div>
                                        ) : (
                                            <div className="d-flex gap-2">
                                                <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => onStartEdit(customer)}>Edit</button>
                                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDeleteCustomer(customer.id)}>Delete</button>
                                                <button type="button" className="btn btn-sm btn-outline-success" onClick={() => onAddOrderForCustomer(customer.id)}>Add Order</button>
                                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onViewCustomerOrders(customer)}>View Orders</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default AdminCustomersTable;
