// Tag: Product Type Sorting
export const sortTypesWithRegularFirst = (types) => {
    return [...(types || [])].sort((a, b) => {
        const aName = String(a?.productTypeName || '').trim();
        const bName = String(b?.productTypeName || '').trim();

        const aPriority = aName.toLowerCase() === 'regular' ? 0 : 1;
        const bPriority = bName.toLowerCase() === 'regular' ? 0 : 1;

        if (aPriority !== bPriority) {
            return aPriority - bPriority;
        }

        const byName = aName.localeCompare(bName, undefined, { sensitivity: 'base' });
        if (byName !== 0) {
            return byName;
        }

        return Number(a?.productTypeId || 0) - Number(b?.productTypeId || 0);
    });
};
