import { Stage } from './stage';
import { StageOverrides } from './types';

export const DEV_CONFIG: StageOverrides = {
  stage: Stage.DEV,
  /** The dev account: pins the stack env so HostedZone.fromLookup can resolve at synth time (region is in common) */
  awsAccount: '046056637293',
  /** Friendly site domain in the dev hosted zone (dev-iet.idp.com, owned by CloudOps) */
  customDomain: {
    hostedZoneName: 'dev-iet.idp.com',
    domainName: 'testtaker.dev-iet.idp.com',
  },
};
