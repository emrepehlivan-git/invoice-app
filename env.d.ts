declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";

    NEXT_PUBLIC_APP_URL: string;

    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;

    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;

    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_DB: string;
    DATABASE_URL: string;

    PADDLE_API_KEY: string;
    PADDLE_WEBHOOK_SECRET: string;
    PADDLE_ENVIRONMENT: "sandbox" | "production";
    PADDLE_DEFAULT_PRICE_ID: string;

    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: string;
    NEXT_PUBLIC_PADDLE_ENVIRONMENT: "sandbox" | "production";
    NEXT_PUBLIC_PADDLE_PRICE_ID: string;

    EMAIL_PROVIDER: string;
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_SECURE: string;
    SMTP_USER: string;
    SMTP_PASS: string;
    EMAIL_FROM_NAME: string;
    EMAIL_FROM_ADDRESS: string;

    CRON_SECRET?: string;
  }
}
