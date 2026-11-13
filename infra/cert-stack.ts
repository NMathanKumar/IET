import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Certificate, CertificateValidation, ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { CustomDomainConfig, StageConfig } from './environments/types';

export interface CertificateStackProps extends StackProps {
  config: StageConfig;
  customDomain: CustomDomainConfig;
}

/**
 * CloudFront only accepts ACM certificates from us-east-1, so the certificate for the site's custom
 * domain lives in its own stack pinned to that region. SiteStack (ap-southeast-1) reads the cert ARN
 * from here via CDK cross-region references (crossRegionReferences: true on both stacks in app.ts).
 *
 * The hosted zone is looked up in us-east-1's view of Route53 (Route53 is global, so the lookup resolves
 * the same zone) and DNS validation writes the CNAME into it.
 */
export class CertificateStack extends Stack {
  readonly certificate: ICertificate;

  constructor(scope: Construct, id: string, { config, customDomain, ...props }: CertificateStackProps) {
    super(scope, id, {
      description: `${config.serviceName}: us-east-1 ACM certificate for the CloudFront custom domain`,
      ...props,
    });

    const hostedZone: IHostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: customDomain.hostedZoneName,
    });

    this.certificate = new Certificate(this, 'SiteCertificate', {
      domainName: customDomain.domainName,
      validation: CertificateValidation.fromDns(hostedZone),
    });
  }
}
