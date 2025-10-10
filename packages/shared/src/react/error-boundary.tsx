import type { ComponentProps, ComponentType, ReactElement, ReactNode } from "react";
import { Component } from "react";

import { bound } from "../decorators";

type ErrorBoundaryProps = {
  fallback: ReactNode | { (error: unknown, boundary: ErrorBoundary): ReactNode };
  children?: ReactNode;
};
type ErrorBoundaryState = {
  error: unknown;
};

/** React render error boundary implementation */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  readonly stats: unknown[] = [];

  componentDidCatch(error: Error) {
    this.stats.push(error);
  }

  @bound
  reset() {
    this.setState({ error: null });
  }
  @bound
  clean() {
    this.reset();
    this.stats.splice(0, this.stats.length);
  }

  render() {
    const { children, fallback } = this.props;
    const { error } = this.state;
    if (error === null) return <>{children}</>;
    if (typeof fallback === "function") return <>{fallback(error, this)}</>;
    return <>{fallback}</>;
  }

  /** Wraps component into ErrorBoundary. */
  static with<Base extends ComponentType<object>>(base: Base, fallback?: ErrorBoundaryProps["fallback"]) {
    const Wrapped = (props: ComponentProps<Base>) => {
      const Base = base as (props: ComponentProps<Base>) => ReactElement;
      return (
        <ErrorBoundary fallback={fallback}>
          <Base {...props} />
        </ErrorBoundary>
      );
    };
    Wrapped.displayName = `ErrorBoundary(${base.displayName ?? base.name})`;
    return Wrapped;
  }
}
