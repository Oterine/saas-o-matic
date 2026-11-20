/** Estado de carga accesible: los lectores de pantalla lo anuncian sin interrumpir. */
export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <p className="state state--loading" role="status">
      {label}
    </p>
  );
}
