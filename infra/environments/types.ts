import { Stage } from './stage';

/**
 * A user-friendly custom domain for the CloudFront distribution. Not set → only the
 * generated *.cloudfront.net URL is available.
 *
 * The hosted zone must already exist in the account (owned by CloudOps/shared-service); CDK
 * looks it up by name at synth time (HostedZone.fromLookup) and caches it in cdk.context.json.
 * CDK then creates an ACM certificate in us-east-1 (CloudFront only accepts certs from that
 * region), attaches the domain to the distribution, and adds a Route53 alias record.
 */
export interface CustomDomainConfig {
  /** The existing hosted zone's name, e.g. 'dev-iet.idp.com' (no trailing dot) */
  hostedZoneName: string;
  /** The fully-qualified domain for the site, e.g. 'testtaker.dev-iet.idp.com' */
  domainName: string;
}

export interface StageConfig {
  stage: Stage;
  /** {app} in IET names: iet-ui-testtaker-..., /iet/dev/... */
  application: string;
  /** {service} leaf for this app */
  service: string;
  /** {app}-{service}: prefix of the stack and resource names */
  serviceName: string;
  /** ApplicationService tag (IDP tagging strategy) */
  applicationService: string;
  /** ProjectName tag: the Jira project */
  projectName: string;
  awsRegion: string;
  /** If set, CDK refuses to deploy with credentials of another account */
  awsAccount?: string;

  /** true → the S3 bucket is kept when the stack is deleted (Retain), else destroyed + emptied */
  retainData: boolean;

  /**
   * A user-friendly custom domain for the site. Not set → only the generated
   * *.cloudfront.net URL is available (e.g. personal / not-yet-configured stages).
   */
  customDomain?: CustomDomainConfig;

  /**
   * Short names. utils.ts adds the rest:
   * resourceName() → iet-ui-testtaker-<name>-dev
   */
  names: {
    /** S3 bucket that holds the built SPA */
    siteBucket: string;
    /** CloudFront distribution */
    distribution: string;
  };
}

/** A stage file overrides only what differs from common */
export type StageOverrides = Pick<StageConfig, 'stage'> & Partial<StageConfig>;
