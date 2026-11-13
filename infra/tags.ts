import { StageConfig } from './environments/types';

/**
 * Tags for every resource in the stack, PascalCase keys (IDP AWS Resources Tagging Strategy). Set in one place
 * because account policies flag resources without the mandatory tags.
 * Who and when: GitLab CI variables in CI, else the local user and the date
 * (date, not time, so two deploys on one day don't retag every resource)
 */
export function stackTags(
  config: StageConfig,
  env: NodeJS.ProcessEnv = process.env,
  now: Date = new Date()
): Record<string, string> {
  const tags: Record<string, string> = {
    ApplicationService: config.applicationService,
    Application: config.application,
    Service: config.serviceName,
    Environment: config.stage,
    ProjectName: config.projectName,
    Repository: env.CI_PROJECT_NAME ?? config.serviceName,
    Branch: env.CI_COMMIT_BRANCH ?? 'local',
    CreatedOrModifiedBy: env.CI_COMMIT_AUTHOR ?? env.USER ?? 'unknown',
    CreatedOrModifiedAt: env.CI_PIPELINE_CREATED_AT ?? now.toISOString().slice(0, 10),
  };
  return Object.fromEntries(Object.entries(tags).map(([key, value]) => [key, toTagValue(value)]));
}

/**
 * Tag values allow only letters, digits, spaces and _ . : / = + - @, up to 256 characters.
 * CI_COMMIT_AUTHOR is "Name <email>": "Eugene Mahota <e@idp.com>" → "Eugene Mahota e@idp.com"
 */
function toTagValue(value: string): string {
  return value
    .replace(/[^\p{L}\p{N}\s_.:/=+\-@]/gu, '')
    .trim()
    .slice(0, 256);
}
