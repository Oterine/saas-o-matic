import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DB_PATH: z.string().trim().min(1).default('./data/saas-o-matic.db'),
});

export type Env = z.infer<typeof envSchema>;

/** Valida la configuración de entorno. Recibe el origen como parámetro para poder testearlo sin tocar process.env. */
export function loadEnv(source: Readonly<Record<string, string | undefined>>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Configuración de entorno inválida: ${details}`);
  }
  return result.data;
}
