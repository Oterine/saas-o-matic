export class CustomerNotFoundError extends Error {
  constructor(readonly customerId: number) {
    super('Cliente no encontrado');
    this.name = 'CustomerNotFoundError';
  }
}
