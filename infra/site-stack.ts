import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib/core';
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
  Distribution,
  HttpVersion,
  PriceClass,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { ARecord, AaaaRecord, HostedZone, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { StageConfig } from './environments/types';
import { stackTags } from './tags';
import { resourceName } from './utils';

export interface SiteStackProps extends StackProps {
  config: StageConfig;
  /** The us-east-1 ACM certificate, present only when config.customDomain is set */
  certificate?: ICertificate;
}

/** Absolute path to the built SPA (Vite outDir). vite build must run before cdk deploy */
const DIST_DIR: string = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

/**
 * Test Taker Portal static site hosting.
 *
 * Private S3 bucket (no public access, not a website bucket) fronted by a CloudFront distribution that
 * reads it through Origin Access Control (OAC) — only CloudFront can get the objects. An optional friendly
 * domain (testtaker.dev-iet.idp.com) is served via an ACM certificate from us-east-1 (CertificateStack) and
 * a Route53 alias. The built SPA in dist/ is uploaded by BucketDeployment, which also invalidates the
 * CloudFront cache on every deploy. SPA deep links work via 403/404 → /index.html rewrites.
 */
export class SiteStack extends Stack {
  readonly distributionUrl: string;
  /** The friendly https:// URL when a custom domain is configured, else undefined */
  readonly customDomainUrl?: string;

  constructor(scope: Construct, id: string, { config, certificate, ...props }: SiteStackProps) {
    super(scope, id, {
      description: `${config.serviceName}: Test Taker Portal static site (private S3 + CloudFront)`,
      ...props,
    });

    /** Mandatory IDP tags on every resource (infra/tags.ts) */
    for (const [key, value] of Object.entries(stackTags(config))) {
      Tags.of(this).add(key, value);
    }

    const removalPolicy: RemovalPolicy = config.retainData ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    /** Private origin bucket: all public access blocked, SSE-S3, CloudFront reads it via OAC */
    const bucket = new Bucket(this, 'SiteBucket', {
      bucketName: resourceName(config, config.names.siteBucket),
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      removalPolicy,
      /** Only empty-on-delete when we're allowed to destroy the bucket (non-prod) */
      autoDeleteObjects: !config.retainData,
    });

    const { customDomain } = config;
    const domainNames: string[] | undefined = customDomain ? [customDomain.domainName] : undefined;

    /**
     * S3BucketOrigin.withOriginAccessControl wires an OAC and the bucket policy that lets this
     * distribution (and only it) read the bucket. The bucket stays fully private.
     */
    const distribution = new Distribution(this, 'Distribution', {
      comment: resourceName(config, config.names.distribution),
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      httpVersion: HttpVersion.HTTP2_AND_3,
      priceClass: PriceClass.PRICE_CLASS_100,
      ...(domainNames && certificate
        ? { domainNames, certificate, minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021 }
        : {}),
      /** SPA routing: let React Router handle unknown paths by serving index.html with a 200 */
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: Duration.minutes(5) },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html', ttl: Duration.minutes(5) },
      ],
    });

    this.distributionUrl = `https://${distribution.distributionDomainName}`;

    /** Upload the built SPA and invalidate the whole distribution so viewers get the new build */
    new BucketDeployment(this, 'DeploySite', {
      sources: [Source.asset(DIST_DIR)],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
      prune: true,
    });

    /** Friendly domain: A (IPv4) + AAAA (IPv6) aliases pointing at the distribution */
    if (customDomain) {
      const hostedZone: IHostedZone = HostedZone.fromLookup(this, 'HostedZone', {
        domainName: customDomain.hostedZoneName,
      });
      const target = RecordTarget.fromAlias(new CloudFrontTarget(distribution));
      new ARecord(this, 'SiteAliasRecord', {
        zone: hostedZone,
        recordName: customDomain.domainName,
        target,
      });
      new AaaaRecord(this, 'SiteAliasRecordV6', {
        zone: hostedZone,
        recordName: customDomain.domainName,
        target,
      });
      this.customDomainUrl = `https://${customDomain.domainName}`;
    }

    new CfnOutput(this, 'DistributionUrl', {
      value: this.distributionUrl,
      description: 'CloudFront distribution URL (always available)',
    });
    if (this.customDomainUrl) {
      new CfnOutput(this, 'SiteUrl', { value: this.customDomainUrl, description: 'Friendly site URL' });
    }
  }
}
