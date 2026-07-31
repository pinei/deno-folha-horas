export function useValidateRecord() {
    const isTsValidDate = (ts) => {
        return !!(ts?.date && /^(\d{4})-(\d{2})-(\d{2})$/.test(ts.date) && !isNaN(new Date(ts.date).getTime()));
    }

    const isTsValidTimeSpent = (ts) => {
        if (ts?.timeSpent === undefined || ts?.timeSpent === null) return false;
        const str = ts.timeSpent.toString().trim();
        if (!/^\d+(\.\d)?$/.test(str)) return false;
        const val = parseFloat(str);
        return !isNaN(val) && val >= 0 && val <= 24;
    }

    const isTsValidCategory = (ts) => {
        return !!(ts?.category?.trim().length > 0);
    }

    const isTsValidContext = (ts) => {
        return !!(ts?.context?.trim().length > 0);
    }

    const isTsValidDescription = (ts) => {
        return !!(ts?.description?.trim().length > 0);
    }

    const isTimesheetValid = (ts) => {
        return isTsValidDate(ts) && isTsValidTimeSpent(ts) && isTsValidCategory(ts) && isTsValidContext(ts) && isTsValidDescription(ts);
    }

    return {
        isTsValidDate,
        isTsValidTimeSpent,
        isTsValidCategory,
        isTsValidContext,
        isTsValidDescription,
        isTimesheetValid
    }
}
