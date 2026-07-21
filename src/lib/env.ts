function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  sessionSecret: () => required("SESSION_SECRET"),
  publicBaseUrl: () => required("PUBLIC_BASE_URL"),
  blobToken: () => required("BLOB_READ_WRITE_TOKEN"),
  telegram: () => ({
    token: required("TELEGRAM_BOT_TOKEN"),
    adminId: required("TELEGRAM_ADMIN_ID"),
  }),
};
