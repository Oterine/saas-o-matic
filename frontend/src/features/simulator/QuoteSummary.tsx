import type { PricingPreview } from '../../api/types';
import { useCurrency } from '../../hooks/useCurrency';
import { formatPercent } from '../../utils/format';

interface QuoteSummaryProps {
  preview: PricingPreview | undefined;
  /** Mientras llega un cálculo nuevo se siguen mostrando los importes anteriores. */
  updating: boolean;
}

/** Base, impuesto y total mensual en la divisa elegida. Solo el total se anuncia al lector de pantalla. */
export function QuoteSummary({ preview, updating }: QuoteSummaryProps) {
  const { formatCents } = useCurrency();

  if (!preview) return <p className="state state--loading">Calculando presupuesto…</p>;

  return (
    <dl className="data-list quote-summary" aria-busy={updating}>
      <div>
        <dt>Base</dt>
        <dd>{formatCents(preview.baseCents)}</dd>
      </div>
      <div>
        <dt>Impuesto ({formatPercent(preview.taxRate)})</dt>
        <dd>{formatCents(preview.taxCents)}</dd>
      </div>
      <div className="data-list__total">
        <dt>Total mensual</dt>
        <dd aria-live="polite">{formatCents(preview.totalCents)}</dd>
      </div>
    </dl>
  );
}
