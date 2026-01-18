import React, { Component } from 'react';
import { createLogger } from '../../utils/logger';

const log = createLogger('ErrorBoundary');

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        log.error('Unhandled error caught by ErrorBoundary', error, {
            componentStack: errorInfo?.componentStack,
        });
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', background: '#ffdddd', color: '#900' }}>
                    <h2> Something went wrong. </h2>{' '}
                    <p> {this.state.error ? this.state.error.toString() : 'Unknown error'} </p>{' '}
                    <details style={{ whiteSpace: 'pre-wrap' }}>
                        {' '}
                        {this.state.errorInfo
                            ? this.state.errorInfo.componentStack
                            : 'No additional error details.'}{' '}
                    </details>{' '}
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
