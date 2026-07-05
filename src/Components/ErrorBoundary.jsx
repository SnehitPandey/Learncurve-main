import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-background border border-text/20 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-text mb-2">
              Oops! Something went wrong
            </h1>
            
            <p className="text-text/60 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-text/70 hover:text-text mb-2">
                  Error Details (Dev Mode)
                </summary>
                <pre className="text-xs bg-text/5 p-4 rounded-lg overflow-auto max-h-48 text-text/70">
                  {this.state.error?.stack}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-alt rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
              
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-text/10 text-text rounded-xl font-medium hover:bg-text/20 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
