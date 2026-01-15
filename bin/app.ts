#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InlinePolicyVersioningStack } from '../lib/inline-policy-versioning-stack';

const app = new cdk.App();
new InlinePolicyVersioningStack(app, 'InlinePolicyVersioningStack');
