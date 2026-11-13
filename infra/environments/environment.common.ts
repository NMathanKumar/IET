import { StageConfig } from './types';

const APPLICATION = 'iet';
const SERVICE = 'ui-testtaker';

export const COMMON_CONFIG: Omit<StageConfig, 'stage'> = {
  application: APPLICATION,
  service: SERVICE,
  serviceName: `${APPLICATION}-${SERVICE}`,
  applicationService: 'IET Test Taker Portal',
  projectName: 'MSP',
  awsRegion: 'ap-southeast-1',

  retainData: false,

  names: {
    siteBucket: 'site',
    distribution: 'cdn',
  },
};
