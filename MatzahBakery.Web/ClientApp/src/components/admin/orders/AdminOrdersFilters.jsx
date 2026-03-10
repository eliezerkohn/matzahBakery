const AdminOrdersFilters = ({
    searchTerm,
    onSearchTermChange,
    onClearSearch,
    customerFilter,
    dateSearch,
    onDateSearchChange,
    onClearDate,
    onClearAll
}) => {
    const hasActiveFilters = Boolean(searchTerm || dateSearch || customerFilter);

    return (
        <>
            {/* Tag: Text Search */}
            <div className="mb-3 d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center">
                <input
                    className="form-control"
                    placeholder="Search by order #, customer, product, or type"
                    value={searchTerm}
                    onChange={(event) => onSearchTermChange(event.target.value)}
                />
                {!!searchTerm && (
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary align-self-start"
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
                <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center">
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
                            className="btn btn-sm btn-outline-secondary align-self-start"
                            onClick={onClearDate}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {hasActiveFilters && (
                <div className="mb-3">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClearAll}>
                        Clear All Filters
                    </button>
                </div>
            )}
        </>
    );
};

export default AdminOrdersFilters;
