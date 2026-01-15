import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class InlinePolicyVersioningStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repo = new codecommit.Repository(this, 'PolicyRepo', {
      repositoryName: 'iam-identity-center-policies',
    });

    const fn = new lambda.Function(this, 'PolicyVersioner', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        REPO_NAME: repo.repositoryName,
      },
    });

    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'sso:GetInlinePolicyForPermissionSet',
        'sso:DescribePermissionSet',
      ],
      resources: ['*'],
    }));

    repo.grant(fn, 'codecommit:PutFile', 'codecommit:GetBranch');

    new events.Rule(this, 'PolicyChangeRule', {
      eventPattern: {
        source: ['aws.sso'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventName: ['PutInlinePolicyToPermissionSet'],
          errorCode: [{ exists: false }],
        },
      },
      targets: [new targets.LambdaFunction(fn)],
    });
  }
}
