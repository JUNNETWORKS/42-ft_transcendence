import { ReactNode, useState } from 'react';

export const ManualErrorBoundary = (props: {
  children: ReactNode;
  error: unknown;
  fallback?: ReactNode;
  FallbackComponent?: (e: unknown) => ReactNode;
  onRetry?: () => void;
}) => {
  if (props.error) {
    if (props.FallbackComponent) {
      return <>{props.FallbackComponent(props.error)}</>;
    }
    if (props.fallback) {
      return <>{props.fallback}</>;
    }
    return (
      <>
        <p>failed.</p>
      </>
    );
  }
  return <>{props.children}</>;
};

export const useManualErrorBoundary = () => {
  const [error, setError] = useState<unknown>(null);
  const HOC = (props: {
    children: ReactNode;
    fallback?: ReactNode;
    FallbackComponent?: (e: unknown) => ReactNode;
    onRetry?: () => void;
  }) => (
    <ManualErrorBoundary
      error={error}
      FallbackComponent={props.FallbackComponent}
      fallback={props.fallback}
      onRetry={props.onRetry}
    >
      {props.children}
    </ManualErrorBoundary>
  );
  return [error, setError, HOC] as const;
};
