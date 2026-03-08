import { useEffect, useState } from 'react';
import axios from 'axios';
import { sortTypesWithRegularFirst } from '../utils/sorters';

const initialProductForm = {
    productName: '',
    productPrice: ''
};

const initialTypeForm = {
    productTypeId: '',
    productTypeName: '',
    typePrice: ''
};

const initialGlobalTypeForm = {
    productTypeName: ''
};

const Admin = () => {
    const [catalog, setCatalog] = useState([]);
    const [globalTypes, setGlobalTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const [productForm, setProductForm] = useState(initialProductForm);
    const [typeFormsByProduct, setTypeFormsByProduct] = useState({});
    const [editingProductId, setEditingProductId] = useState(null);
    const [editingTypeKey, setEditingTypeKey] = useState('');
    const [editProductForm, setEditProductForm] = useState(initialProductForm);
    const [editTypeForm, setEditTypeForm] = useState(initialTypeForm);
    const [globalTypeForm, setGlobalTypeForm] = useState(initialGlobalTypeForm);
    const [selectedGlobalTypeId, setSelectedGlobalTypeId] = useState('');
    const [isEditingGlobalType, setIsEditingGlobalType] = useState(false);
    const [editGlobalTypeName, setEditGlobalTypeName] = useState('');

    const sortedGlobalTypes = sortTypesWithRegularFirst(globalTypes);

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsResponse, typesResponse] = await Promise.all([
                axios.get('/api/products'),
                axios.get('/api/product-types')
            ]);

            setCatalog(Array.isArray(productsResponse.data) ? productsResponse.data : []);
            setGlobalTypes(Array.isArray(typesResponse.data) ? typesResponse.data : []);
            setMessage('');
            setIsError(false);
        } catch {
            setMessage('Could not load admin data from backend API.');
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const addProduct = async (event) => {
        event.preventDefault();

        try {
            await axios.post('/api/products', {
                productName: productForm.productName,
                productPrice: Number(productForm.productPrice) || 0
            });
            setProductForm(initialProductForm);
            setMessage('Product added.');
            setIsError(false);
            await loadData();
        } catch {
            setMessage('Could not add product.');
            setIsError(true);
        }
    };

    const removeProduct = async (productId) => {
        try {
            await axios.delete(`/api/products/${productId}`);
            setMessage('Product removed.');
            setIsError(false);
            await loadData();
        } catch {
            setMessage('Could not remove product.');
            setIsError(true);
        }
    };

    const startEditProduct = (product) => {
        setEditingProductId(product.productId);
        setEditProductForm({
            productName: product.productName || '',
            productPrice: String(product.productPrice ?? 0)
        });
    };

    const cancelEditProduct = () => {
        setEditingProductId(null);
        setEditProductForm(initialProductForm);
    };

    const saveProduct = async (productId) => {
        try {
            await axios.put(`/api/products/${productId}`, {
                productName: editProductForm.productName,
                productPrice: Number(editProductForm.productPrice) || 0
            });
            setEditingProductId(null);
            setEditProductForm(initialProductForm);
            setMessage('Product updated.');
            setIsError(false);
            await loadData();
        } catch {
            setMessage('Could not update product.');
            setIsError(true);
        }
    };

    const getTypeForm = (productId) => typeFormsByProduct[productId] || initialTypeForm;

    const updateTypeForm = (productId, updates) => {
        setTypeFormsByProduct((prev) => ({
            ...prev,
            [productId]: {
                ...getTypeForm(productId),
                ...updates
            }
        }));
    };

    const resetTypeForm = (productId) => {
        setTypeFormsByProduct((prev) => ({
            ...prev,
            [productId]: initialTypeForm
        }));
    };

    const addType = async (event, productId) => {
        event.preventDefault();
        const typeForm = getTypeForm(productId);
        const typedTypeName = typeForm.productTypeName?.trim() || '';
        const hasSelectedTypeId = Boolean(typeForm.productTypeId);
        const hasTypedTypeName = Boolean(typedTypeName) && !hasSelectedTypeId;
        const selectedGlobalType = globalTypes.find(
            (item) => String(item.productTypeId) === String(typeForm.productTypeId)
        );
        const selectedTypeName = selectedGlobalType?.productTypeName?.trim() || '';

        if (!hasSelectedTypeId && !hasTypedTypeName) {
            setMessage('Select a global type or enter a new type name.');
            setIsError(true);
            return;
        }

        const product = catalog.find((item) => item.productId === productId);
        if (product) {
            const hasDuplicateSelectedType = hasSelectedTypeId
                && (product.types || []).some((item) => String(item.productTypeId) === String(typeForm.productTypeId));
            const hasDuplicateTypedType = hasTypedTypeName
                && (product.types || []).some(
                    (item) => (item.productTypeName || '').trim().toLowerCase() === typedTypeName.toLowerCase()
                );

            if (hasDuplicateSelectedType || hasDuplicateTypedType) {
                setMessage('This type is already linked to the selected product.');
                setIsError(true);
                return;
            }
        }

        try {
            const resolvedTypeName = hasTypedTypeName ? typedTypeName : selectedTypeName;
            const typePriceValue = Number(typeForm.typePrice) || 0;

            await axios.post(`/api/products/${productId}/types`, {
                ...(hasSelectedTypeId ? { productTypeId: Number(typeForm.productTypeId) } : {}),
                ...(resolvedTypeName ? { productTypeName: resolvedTypeName } : {}),
                typePrice: typePriceValue
            });

            resetTypeForm(productId);
            setMessage('Type added.');
            setIsError(false);
            await loadData();
        } catch (error) {
            const backendMessage = error?.response?.data?.message
                || Object.values(error?.response?.data?.errors || {}).flat().join(' ');
            setMessage(backendMessage || `Could not add type (HTTP ${error?.response?.status || 'error'}).`);
            setIsError(true);
        }
    };

    const addGlobalType = async (event) => {
        event.preventDefault();

        try {
            await axios.post('/api/product-types', {
                productTypeName: globalTypeForm.productTypeName
            });
            setGlobalTypeForm(initialGlobalTypeForm);
            setMessage('Global type name added.');
            setIsError(false);
            await loadData();
        } catch {
            setMessage('Could not add global type name.');
            setIsError(true);
        }
    };

    const removeGlobalType = async (productTypeId) => {
        try {
            await axios.delete(`/api/product-types/${productTypeId}`);
            setMessage('Global type removed.');
            setIsError(false);
            await loadData();
        } catch {
            setMessage('Could not remove global type.');
            setIsError(true);
        }
    };

    const removeSelectedGlobalType = async () => {
        if (!selectedGlobalTypeId) {
            setMessage('Select a global type to remove.');
            setIsError(true);
            return;
        }

        await removeGlobalType(selectedGlobalTypeId);
    };

    const startEditGlobalType = () => {
        const selectedType = globalTypes.find((type) => String(type.productTypeId) === String(selectedGlobalTypeId));
        if (!selectedType) {
            setMessage('Select a global type to edit.');
            setIsError(true);
            return;
        }

        setEditGlobalTypeName(selectedType.productTypeName || '');
        setIsEditingGlobalType(true);
    };

    const cancelEditGlobalType = () => {
        setIsEditingGlobalType(false);
        setEditGlobalTypeName('');
    };

    const saveGlobalType = async () => {
        if (!selectedGlobalTypeId) {
            setMessage('Select a global type to save.');
            setIsError(true);
            return;
        }

        try {
            await axios.put(`/api/product-types/${selectedGlobalTypeId}`, {
                productTypeName: (editGlobalTypeName || '').trim(),
                typePrice: 0
            });
            setMessage('Global type updated.');
            setIsError(false);
            setIsEditingGlobalType(false);
            setEditGlobalTypeName('');
            await loadData();
        } catch {
            setMessage('Could not update global type.');
            setIsError(true);
        }
    };

    const removeType = async (productId, productTypeId) => {
        try {
            await axios.delete(`/api/products/${productId}/types/${productTypeId}`);
            setMessage('Type removed.');
            setIsError(false);
            await loadData();
        } catch {
            setMessage('Could not remove type.');
            setIsError(true);
        }
    };

    const startEditType = (productId, type) => {
        setEditingTypeKey(`${productId}:${type.productTypeId}`);
        setEditTypeForm({
            productTypeId: String(type.productTypeId),
            productTypeName: type.productTypeName || '',
            typePrice: String(type.typePrice ?? 0)
        });
    };

    const cancelEditType = () => {
        setEditingTypeKey('');
        setEditTypeForm(initialTypeForm);
    };

    const saveType = async (productId, productTypeId, productTypeName) => {
        try {
            await axios.put(`/api/products/${productId}/types/${productTypeId}`, {
                productTypeName,
                typePrice: Number(editTypeForm.typePrice) || 0
            });
            setEditingTypeKey('');
            setEditTypeForm(initialTypeForm);
            setMessage('Type updated.');
            setIsError(false);
            await loadData();
        } catch {
            setMessage('Could not update type.');
            setIsError(true);
        }
    };

    if (loading) {
        return <div className="container py-5">Loading admin page...</div>;
    }

    return (
        <div className="container py-5">
            <h1 className="order-title mb-4">Admin</h1>

            {message && <div className={`mb-3 ${isError ? 'text-danger' : 'text-success'}`}>{message}</div>}

            <div className="row g-4">
                <div className="col-12 col-lg-6">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="h5 mb-3">Add Product</h2>
                            <form className="row g-2" onSubmit={addProduct}>
                                <div className="col-12">
                                    <input
                                        className="form-control"
                                        placeholder="Product Name"
                                        value={productForm.productName ?? ''}
                                        onChange={(event) => setProductForm((prev) => ({ ...prev, productName: event.target.value }))}
                                    />
                                </div>
                                <div className="col-12">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="form-control"
                                        placeholder="Base Price"
                                        value={productForm.productPrice ?? ''}
                                        onChange={(event) => setProductForm((prev) => ({ ...prev, productPrice: event.target.value }))}
                                    />
                                </div>
                                <div className="col-12">
                                    <button type="submit" className="btn btn-dark">Add Product</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-6">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="h5 mb-3">Product Types</h2>
                            <form className="row g-2" onSubmit={addGlobalType}>
                                <div className="col-12 col-md-8">
                                    <input
                                        className="form-control"
                                        placeholder="Global Type Name"
                                        value={globalTypeForm.productTypeName ?? ''}
                                        onChange={(event) =>
                                            setGlobalTypeForm((prev) => ({ ...prev, productTypeName: event.target.value }))
                                        }
                                    />
                                </div>
                                <div className="col-12 col-md-4">
                                    <button type="submit" className="btn btn-dark w-100">Add Global Type</button>
                                </div>
                            </form>
                            <div className="mt-2 small text-muted">Type names are global. Price is set per product.</div>
                            <div className="mt-3">
                                <h3 className="h6 mb-2">Global Types</h3>
                                {!sortedGlobalTypes.length && <div className="small text-muted">No global types yet.</div>}
                                {!!sortedGlobalTypes.length && (
                                    <div>
                                        <select
                                            className="form-select"
                                            value={selectedGlobalTypeId}
                                            onChange={(event) => setSelectedGlobalTypeId(event.target.value)}
                                        >
                                            <option value="">Select global type</option>
                                            {sortedGlobalTypes.map((type) => (
                                                <option key={type.productTypeId} value={String(type.productTypeId)}>
                                                    {type.productTypeName}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger mt-2"
                                            onClick={removeSelectedGlobalType}
                                        >
                                            Remove Selected
                                        </button>
                                        {!isEditingGlobalType ? (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-dark mt-2 ms-2"
                                                onClick={startEditGlobalType}
                                            >
                                                Edit Selected
                                            </button>
                                        ) : (
                                            <div className="mt-2">
                                                <input
                                                    className="form-control form-control-sm"
                                                    value={editGlobalTypeName}
                                                    onChange={(event) => setEditGlobalTypeName(event.target.value)}
                                                />
                                                <div className="d-flex gap-2 mt-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-dark"
                                                        onClick={saveGlobalType}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={cancelEditGlobalType}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mt-4">
                <div className="card-body">
                    <h2 className="h5 mb-3">Current Catalog</h2>
                    {!catalog.length && <p className="mb-0">No products yet.</p>}
                    {catalog.map((product) => (
                        <div key={product.productId} className="border rounded p-3 mb-3">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div className="col-12 col-lg-7">
                                    {editingProductId === product.productId ? (
                                        <div className="row g-2">
                                            <div className="col-12 col-md-7">
                                                <input
                                                    className="form-control form-control-sm"
                                                    value={editProductForm.productName ?? ''}
                                                    onChange={(event) =>
                                                        setEditProductForm((prev) => ({ ...prev, productName: event.target.value }))
                                                    }
                                                />
                                            </div>
                                            <div className="col-12 col-md-5">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="form-control form-control-sm"
                                                    value={editProductForm.productPrice ?? ''}
                                                    onChange={(event) =>
                                                        setEditProductForm((prev) => ({ ...prev, productPrice: event.target.value }))
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <strong>{product.productName}</strong> - ${Number(product.productPrice || 0).toFixed(2)}
                                        </>
                                    )}
                                </div>
                                <div className="d-flex gap-2">
                                    {editingProductId === product.productId ? (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-dark"
                                                onClick={() => saveProduct(product.productId)}
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={cancelEditProduct}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-dark"
                                                onClick={() => startEditProduct(product)}
                                            >
                                                Edit Product
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => removeProduct(product.productId)}
                                            >
                                                Remove Product
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 border-top pt-3">
                                <h3 className="h6 mb-2">Types for {product.productName}</h3>

                                <form className="row g-2 mb-3" onSubmit={(event) => addType(event, product.productId)}>
                                    <div className="col-12 col-md-4">
                                        <select
                                            className="form-select form-select-sm"
                                            value={getTypeForm(product.productId).productTypeId ?? ''}
                                            onChange={(event) =>
                                                updateTypeForm(product.productId, {
                                                    productTypeId: event.target.value,
                                                    productTypeName:
                                                        globalTypes.find(
                                                            (item) => String(item.productTypeId) === String(event.target.value)
                                                        )?.productTypeName || ''
                                                })
                                            }
                                        >
                                            <option value="">Select global type</option>
                                            {sortedGlobalTypes.map((type) => (
                                                <option key={type.productTypeId} value={type.productTypeId}>
                                                    {type.productTypeName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                              
                                    <div className="col-12 col-md-4">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control form-control-sm"
                                            placeholder="Type Price (can be negative)"
                                            value={getTypeForm(product.productId).typePrice ?? ''}
                                            onChange={(event) =>
                                                updateTypeForm(product.productId, { typePrice: event.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="col-12 col-md-3">
                                        <button type="submit" className="btn btn-sm btn-dark w-100">Add Type</button>
                                    </div>
                                </form>

                                {!sortTypesWithRegularFirst(product.types || []).length && <div className="text-muted small">No types for this product.</div>}
                                {sortTypesWithRegularFirst(product.types || []).map((type) => (
                                    <div
                                        key={type.productTypeId}
                                        className="d-flex justify-content-between align-items-center border rounded p-2 mb-2"
                                    >
                                        {editingTypeKey === `${product.productId}:${type.productTypeId}` ? (
                                            <div className="row g-2 w-100 align-items-center">
                                                <div className="col-12 col-md-5">
                                                    <div className="small text-muted">{type.productTypeName}</div>
                                                </div>
                                                <div className="col-12 col-md-3">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="form-control form-control-sm"
                                                        value={editTypeForm.typePrice ?? ''}
                                                        onChange={(event) =>
                                                            setEditTypeForm((prev) => ({ ...prev, typePrice: event.target.value }))
                                                        }
                                                    />
                                                </div>
                                                <div className="col-12 col-md-4 d-flex gap-2 justify-content-md-end">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-dark"
                                                        onClick={() => saveType(product.productId, type.productTypeId, type.productTypeName)}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={cancelEditType}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => removeType(product.productId, type.productTypeId)}
                                                    >
                                                        Remove Type
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <span>{type.productTypeName} - ${Number(type.typePrice || 0).toFixed(2)}</span>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-dark"
                                                        onClick={() => startEditType(product.productId, type)}
                                                    >
                                                        Edit Price
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => removeType(product.productId, type.productTypeId)}
                                                    >
                                                        Remove Type
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Admin;
