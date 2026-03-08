const AdminOrdersFilters = ({
    searchTerm,
    onSearchTermChange,
    onClearSearch,
    customerFilter,
    dateSearch,
    onDateSearchChange,
    onClearDate
}) => {
    return (
        <>
            {/* Tag: Text Search */}
            <div className="mb-3 d-flex gap-2 align-items-center">
                <input
                    className="form-control"
                    placeholder="Search by order #, customer, product, or type"
                    value={searchTerm}
                    onChange={(event) => onSearchTermChange(event.target.value)}
                />
                {!!searchTerm && (
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={onClearSearch}
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Tag: Active Customer Filter Badge */}
            {!!customerFilter && (
                <div className="mb-3 d-flex gap-2 align-items-center">
                    <span className="badge text-bg-secondary">Customer ID: {customerFilter}</span>
                </div>
            )}

            {/* Tag: Date Filter */}
            <div className="mb-3">
                <label className="form-label">Filter by date</label>
                <div className="d-flex gap-2 align-items-center">
                    <input
                        type="date"
                        className="form-control"
                        style={{ maxWidth: '260px' }}
                        value={dateSearch}
                        onChange={(event) => onDateSearchChange(event.target.value)}
                    />
                    {!!dateSearch && (
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={onClearDate}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminOrdersFilters;
