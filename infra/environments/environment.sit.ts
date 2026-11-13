import { Stage } from './stage';
import { StageOverrides } from './types';

/**
 * TODO: SIT account id and hosted zone from CloudOps. Until then this stage deploys only the
 * *.cloudfront.net URL (no customDomain), which needs no hosted-zone lookup.
 */
export const SIT_CONFIG: StageOverrides = { stage: Stage.SIT };
