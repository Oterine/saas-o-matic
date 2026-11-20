interface ErrorMessageProps {
  message: string;
  /** Si se indica, muestra el botón «Reintentar». */
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="state state--error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
