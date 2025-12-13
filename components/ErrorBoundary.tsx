"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by boundary:", error, errorInfo);
    // You could also log to an error reporting service here
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 bg-red-900/20 border border-red-700 rounded-lg">
            <h2 className="text-xl font-bold text-red-500 mb-2">
              Something went wrong
            </h2>
            <p className="text-zinc-300">Please try refreshing the page</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
