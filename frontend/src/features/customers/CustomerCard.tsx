import { Link } from 'react-router-dom';
import type { Customer } from '../../api/types';
import { Card } from '../../components/Card';
import { countryName, planLabel } from '../../utils/display';

/**
 * Tarjeta del listado. Toda la tarjeta es clicable gracias a un "enlace estirado" (ver customers.css),
 * pero sigue habiendo un único enlace, con el nombre de la empresa, para teclado y lectores de pantalla.
 */
export function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <Card as="li" className="customer-card">
      <div className="customer-card__header">
        <h2 className="customer-card__name">
          <Link to={`/customers/${customer.id}`} className="customer-card__link">
            {customer.companyName}
          </Link>
        </h2>
        <span className="plan-badge">
          <span className="visually-hidden">Plan </span>
          {planLabel(customer.plan)}
        </span>
      </div>
      <dl className="data-list">
        <div>
          <dt>Identificador fiscal</dt>
          <dd>{customer.taxId}</dd>
        </div>
        <div>
          <dt>País</dt>
          <dd>{countryName(customer.country)}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{customer.contactEmail}</dd>
        </div>
      </dl>
    </Card>
  );
}
