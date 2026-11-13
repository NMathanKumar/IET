/**
 * cdk deploy -c stage=dev. Same stages as the rest of IET: dev → sit / uat → prod,
 * one AWS account per stage. No imports on purpose so it can be reused anywhere.
 */
export enum Stage {
  DEV = 'dev',
  SIT = 'sit',
  UAT = 'uat',
  PROD = 'prod',
}
