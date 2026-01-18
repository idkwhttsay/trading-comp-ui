export function getApiBaseUrl() {
    return process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
}

export function getWsBaseUrl() {
    return process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:8080';
}
