/**
 * Typed environment configuration.
 *
 * This is the ONLY module allowed to read environment variables.
 * Application and feature code must import from here, never read process.env
 * or import.meta.env directly. The quality gate enforces this rule.
 */

export interface Env {
  readonly APP_ENV: 'development' | 'test' | 'production';
  readonly APP_TITLE: string;
}

export const env: Env = {
  APP_ENV: (import.meta.env.MODE as Env['APP_ENV']) || 'development',
  APP_TITLE: (import.meta.env.VITE_APP_TITLE as string) || 'Pomodoro Timer',
} satisfies Env;
