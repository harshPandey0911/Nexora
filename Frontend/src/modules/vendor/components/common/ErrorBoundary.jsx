import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiChevronRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Vendor App Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="flex flex-col items-center p-8 max-w-lg mx-auto text-center">
            <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center mb-8 border border-rose-100 shadow-sm">
              <FiAlertTriangle className="w-12 h-12 text-rose-500" />
            </div>
            
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3 uppercase leading-tight">
              Operational Protocol Interrupted
            </h2>
            
            <p className="text-sm font-medium text-gray-500 mb-10 max-w-sm">
              The dashboard encountered a runtime conflict. This could be due to a lost connection or temporary sync issue.
            </p>
            
            <button
              onClick={() => window.location.reload()}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
            >
              <FiRefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
              Re-initialize Interface
            </button>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-12 w-full text-left">
                <details className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden group">
                  <summary className="flex items-center justify-between cursor-pointer p-4 hover:bg-gray-100 transition-all select-none">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Diagnostic Intel</span>
                    <FiChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="p-4 border-t border-gray-100 bg-white">
                    <pre className="text-[10px] text-rose-600 font-mono overflow-auto max-h-60 leading-relaxed">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
