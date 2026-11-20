import { useId } from 'react';
import type { Customer } from '../../api/types';
import { Card } from '../../components/Card';
import { countryName, planLabel } from '../../utils/display';
import { formatDate } from '../../utils/format';

/** Datos del cliente en una tarjeta (spec §7). */
export function CustomerInfoCard({ customer }: { customer: Customer }) {
  const titleId = useId();
  return (
    <Card as="section" className="detail-card" labelledBy={titleId}>
      <h2 id={titleId}>Datos del cliente</h2>
      <dl className="data-list">
        <div>
          <dt>Identificador fiscal</dt>
          <dd>{customer.taxId}</dd>
        </div>
        <div>
          <dt>Email de contacto</dt>
          <dd>
            <a href={`mailto:${customer.contactEmail}`}>{customer.contactEmail}</a>
          </dd>
        </div>
        <div>
          <dt>País</dt>
          <dd>{countryName(customer.country)}</dd>
        </div>
        <div>
          <dt>Plan</dt>
          <dd>{planLabel(customer.plan)}</dd>
        </div>
        <div>
          <dt>Alta</dt>
          <dd>{formatDate(customer.createdAt)}</dd>
        </div>
      </dl>
    </Card>
  );
}
