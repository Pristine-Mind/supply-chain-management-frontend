import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class LocationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Location error caught:', error, errorInfo);
    this.setState((prev) => ({
      errorCount: prev.errorCount + 1,
    }));
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: 0,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg border border-red-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  An error occurred while processing location information.
                </p>

                {this.state.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-xs text-red-700 font-mono break-words">
                    {this.state.error.message}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={this.handleReset}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Go Home
                  </button>
                </div>

                {this.state.errorCount > 2 && (
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Multiple errors occurred. Please refresh the page.
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default LocationErrorBoundary;
