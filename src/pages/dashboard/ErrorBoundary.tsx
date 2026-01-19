import React, { Component } from 'react';
import { createLogger } from '../../utils/logger';

const log = createLogger('ErrorBoundary');

type ErrorBoundaryProps = React.PropsWithChildren<Record<string, never>>;

type ErrorBoundaryState = {
    hasError: boolean;
    error: unknown;
    errorInfo: React.ErrorInfo | null;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
        return { hasError: true, error: error };
    }

    componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
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
