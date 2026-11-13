import { Stage } from './stage';
import { StageOverrides } from './types';

/**
 * TODO: PROD account id, hosted zone and domain from CloudOps. Until then this stage deploys only
 * the *.cloudfront.net URL (no customDomain), which needs no hosted-zone lookup.
 */
export const PROD_CONFIG: StageOverrides = {
  stage: Stage.PROD,
  /** Keep the site bucket on stack deletion */
  retainData: true,
};
