import { StageConfig } from './environments/types';

/** The environment segment that ends the stack name and every resource name */
export function envName(config: StageConfig): string {
  return config.stage;
}

/** A resource of this app: 'site' → iet-ui-testtaker-site-dev */
export function resourceName(config: StageConfig, name: string): string {
  return `${config.serviceName}-${name}-${envName(config)}`;
}

/** A name with its own style, stage at the end: 'IET-TestTaker' → IET-TestTaker-dev */
export function envSuffixed(config: StageConfig, name: string): string {
  return `${name}-${envName(config)}`;
}
