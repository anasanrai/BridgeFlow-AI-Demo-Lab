"use client";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: string;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <p className="text-[13px] text-t3 mb-1">
              {this.props.fallback || "Something went wrong loading this agent."}
            </p>
            <p className="text-[11px] text-t4 font-mono">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 text-[12px] underline"
              style={{ color: "#6366F1" }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
