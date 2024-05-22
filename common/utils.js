/**
 * Handles network errors by logging them without terminating the process.
 * @param {Error} error - The error object to be logged.
 */
function handleNetworkError(error) {
    console.error("Network Error:", error.message);
    // The function intentionally does not terminate the process to allow the application to continue running.
}
