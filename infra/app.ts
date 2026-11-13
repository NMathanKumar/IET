import { App } from 'aws-cdk-lib/core';
import { CertificateStack } from './cert-stack';
import { buildConfig } from './environments/env-builder';
import { SiteStack } from './site-stack';
import { envName } from './utils';

const app: App = new App();

/** cdk deploy -c stage=prod → prod. Default stage (dev) is in cdk.json → context.stage. */
const config = buildConfig(app.node.tryGetContext('stage'));

/** CDK_DEFAULT_ACCOUNT is the account of the current credentials: AWS_PROFILE locally, the OIDC role in CI */
const account: string | undefined = config.awsAccount ?? process.env.CDK_DEFAULT_ACCOUNT;
const baseName = `${config.serviceName}-${envName(config)}`;

/**
 * When a friendly domain is configured, CloudFront needs an ACM cert in us-east-1. It goes in its own
 * stack pinned to that region; SiteStack reads the ARN via cross-region references. Without a domain
 * (sit/uat/prod until CloudOps provides one) only the *.cloudfront.net URL is served and no cert is made.
 */
const certStack = config.customDomain
  ? new CertificateStack(app, `${baseName}-cert`, {
      config,
      customDomain: config.customDomain,
      crossRegionReferences: true,
      env: { account, region: 'us-east-1' },
    })
  : undefined;

new SiteStack(app, baseName, {
  config,
  certificate: certStack?.certificate,
  crossRegionReferences: true,
  env: { account, region: config.awsRegion },
});
