import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Shield } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorId: string;
    retryCount: number;
}

interface ErrorReport {
    id: string;
    timestamp: Date;
    error: Error;
    errorInfo: ErrorInfo;
    userAgent: string;
    url: string;
    componentStack: string;
    resolved: boolean;
}

class ComprehensiveErrorBoundary extends Component<
    { children?: ReactNode },
    ErrorBoundaryState,
    { hasError: false, error: null, errorInfo: null, errorId: '', retryCount: 0 }
> {
    private errorReports: ErrorReport[] = [];

    constructor(props: { children?: ReactNode }) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: '',
            retryCount: 0
        };
    }

    static getDerivedStateFromError(error: Error, errorInfo: ErrorInfo): ErrorBoundaryState {
        const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Log error to console for debugging
        console.error('Error caught by boundary:', error, errorInfo);
        
        return {
            hasError: true,
            error,
            errorInfo,
            errorId,
            retryCount: 0
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const errorReport: ErrorReport = {
            id: this.state.errorId,
            timestamp: new Date(),
            error,
            errorInfo,
            userAgent: navigator.userAgent,
            url: window.location.href,
            componentStack: errorInfo.componentStack || '',
            resolved: false
        };

        this.errorReports.push(errorReport);
        
        // Save to localStorage for debugging
        try {
            const existingReports = JSON.parse(localStorage.getItem('errorReports') || '[]');
            existingReports.push(errorReport);
            localStorage.setItem('errorReports', JSON.stringify(existingReports.slice(-50))); // Keep last 50 errors
        } catch (e) {
            console.error('Failed to save error report:', e);
        }

        // Send error to monitoring service (in production)
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
            this.sendErrorToMonitoring(errorReport);
        }
    }

    private sendErrorToMonitoring = async (errorReport: ErrorReport) => {
        try {
            // Simulate sending to monitoring service
            await fetch('/api/errors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(errorReport)
            });
        } catch (e) {
            console.error('Failed to send error to monitoring:', e);
        }
    }

    private handleRetry = () => {
        this.setState(prevState => ({
            ...prevState,
            retryCount: prevState.retryCount + 1
        }));
        
        // Trigger a page reload after 3 retries
        if (this.state.retryCount >= 2) {
            window.location.reload();
        }
    }

    
    private getErrorType = (error: Error): string => {
        if (error.name === 'ChunkLoadError') return 'Chunk Load Error';
        if (error.message.includes('Network')) return 'Network Error';
        if (error.message.includes('Permission')) return 'Permission Error';
        if (error.message.includes('SyntaxError')) return 'Syntax Error';
        if (error.message.includes('TypeError')) return 'Type Error';
        if (error.message.includes('ReferenceError')) return 'Reference Error';
        return 'Unknown Error';
    }

    private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
        const errorType = this.getErrorType(error);
        
        if (errorType === 'Chunk LoadError') return 'medium';
        if (errorType === 'Network Error') return 'high';
        if (errorType === 'Permission Error') return 'critical';
        if (errorType === 'Syntax Error') return 'high';
        if (errorType === 'Type Error') return 'medium';
        if (errorType === 'Reference Error') return 'medium';
        
        return 'low';
    }

    private getErrorSolution = (error: Error): string => {
        const errorType = this.getErrorType(error);
        
        switch (errorType) {
            case 'Chunk Load Error':
                return 'Clear your browser cache and reload the page. This usually happens when the application is updated.';
            case 'Network Error':
                return 'Check your internet connection and try again. If the problem persists, contact our support team.';
            case 'Permission Error':
                return 'Please enable the necessary permissions in your browser settings and reload the page.';
            case 'Syntax Error':
                return 'This is a programming error on our end. Please try again or contact support if it continues.';
            case 'Type Error':
                return 'There was a type mismatch in the application. Please refresh the page and try again.';
            case 'Reference Error':
                return 'A required resource was not found. Please refresh the page and try again.';
            default:
                return 'An unexpected error occurred. Please refresh the page and try again. If the problem continues, please contact support.';
        }
    }

    render() {
        if (this.state.hasError && this.state.error) {
            const errorType = this.getErrorType(this.state.error);
            const severity = this.getErrorSeverity(this.state.error);
            const solution = this.getErrorSolution(this.state.error);

            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full">
                        {/* Error Header */}
                        <div className={`rounded-t-lg p-6 ${
                            severity === 'critical' ? 'bg-red-600' :
                            severity === 'high' ? 'bg-orange-600' :
                            severity === 'medium' ? 'bg-yellow-600' :
                            'bg-blue-600'
                        }`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-3 rounded-full ${
                                    severity === 'critical' ? 'bg-red-800' :
                                    severity === 'high' ? 'bg-orange-800' :
                                    severity === 'medium' ? 'bg-yellow-800' :
                                    'bg-blue-800'
                                }`}>
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white mb-2">
                                        Oops! Something went wrong
                                    </h1>
                                    <p className="text-white/90">
                                        {errorType} (ID: {this.state.errorId})
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Error Details */}
                        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Details</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Error Message:</span>
                                            <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                                                {this.state.error.message}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Error Type:</span>
                                            <span className="text-sm text-gray-600">{errorType}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Severity:</span>
                                            <span className={`text-sm font-medium ${
                                                severity === 'critical' ? 'text-red-600' :
                                                severity === 'high' ? 'text-orange-600' :
                                                severity === 'medium' ? 'text-yellow-600' :
                                                'text-blue-600'
                                            }`}>
                                                {severity.toUpperCase()}
                                            </span>
                                        </div>
                                        {this.state.errorInfo && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">Component Stack:</span>
                                                <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
                                                    {this.state.errorInfo.componentStack}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">System Information</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">URL:</span>
                                            <p className="text-sm text-gray-600 break-all">{window.location.href}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Timestamp:</span>
                                            <p className="text-sm text-gray-600">{new Date().toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">Retry Attempts:</span>
                                            <span className="text-sm text-gray-600">{this.state.retryCount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Solution */}
                            <div className={`rounded-lg p-4 ${
                                severity === 'critical' ? 'bg-red-50 border border-red-200' :
                                severity === 'high' ? 'bg-orange-50 border border-orange-200' :
                                severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                                'bg-blue-50 border border-blue-200'
                            }`}>
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`p-2 rounded-full ${
                                        severity === 'critical' ? 'bg-red-600' :
                                        severity === 'high' ? 'bg-orange-600' :
                                        severity === 'medium' ? 'bg-yellow-600' :
                                        'bg-blue-600'
                                    }`}>
                                        <Bug className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">What happened?</h4>
                                        <p className="text-sm text-gray-600">{solution}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={this.handleRetry}
                                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Try Again
                                    </button>
                                    
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Home className="w-4 h-4" />
                                        Go Home
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(this.state.errorId);
                                            alert('Error ID copied to clipboard!');
                                        }}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Shield className="w-4 h-4" />
                                        Copy Error ID
                                    </button>
                                </div>
                            </div>

                            {/* Additional Help */}
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2">Need more help?</h4>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <p>• Check your internet connection</p>
                                    <p>• Clear your browser cache and cookies</p>
                                    <p>• Try using a different browser</p>
                                    <p>• Contact our support team with the Error ID above</p>
                                </div>
                            </div>
                        </div>

                        {/* Error Reports (for debugging) */}
                        {typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' && this.errorReports.length > 0 && (
                            <details className="mt-6 bg-white rounded-lg shadow-xl p-4">
                                <summary className="cursor-pointer font-semibold text-gray-900 mb-2">
                                    Debug Information ({this.errorReports.length} errors)
                                </summary>
                                <div className="space-y-2">
                                    {this.errorReports.slice(-5).map((report) => (
                                        <div key={report.id} className="border-b border-gray-200 pb-2 last:border-b-0">
                                            <div className="text-xs text-gray-600">
                                                <p><strong>ID:</strong> {report.id}</p>
                                                <p><strong>Time:</strong> {report.timestamp.toLocaleString()}</p>
                                                <p><strong>Type:</strong> {this.getErrorType(report.error)}</p>
                                                <p><strong>Message:</strong> {report.error.message}</p>
                                                <p><strong>URL:</strong> {report.url}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ComprehensiveErrorBoundary;
