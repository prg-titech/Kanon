__$__.Error = {
    hasError: false,
    message: null,

    setError(errorMessage = false) {
        if (errorMessage === false) {
            __$__.Error.hasError = false;
            __$__.Error.message = null;
        } else {
            __$__.Error.hasError = true;
            __$__.Error.message = errorMessage;
        }
    }
};