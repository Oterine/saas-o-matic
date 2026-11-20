import { Link } from 'react-router-dom';
import type { Customer } from '../../api/types';
import { Card } from '../../components/Card';
import { countryName, planLabel } from '../../utils/display';

export function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <Card as="li" className="customer-card">
      <h2 className="customer-card__name">
        <Link to={`/customers/${customer.id}`}>{customer.companyName}</Link>
      </h2>
      <dl className="customer-card__data">
        <div>
          <dt>Identificador fiscal</dt>
          <dd>{customer.taxId}</dd>
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
          <dt>Email</dt>
          <dd>{customer.contactEmail}</dd>
        </div>
      </dl>
    </Card>
  );
}
