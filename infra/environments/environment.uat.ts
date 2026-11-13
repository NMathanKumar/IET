import { Stage } from './stage';
import { StageOverrides } from './types';

/**
 * TODO: UAT account id and hosted zone from CloudOps. Until then this stage deploys only the
 * *.cloudfront.net URL (no customDomain), which needs no hosted-zone lookup.
 */
export const UAT_CONFIG: StageOverrides = { stage: Stage.UAT };
