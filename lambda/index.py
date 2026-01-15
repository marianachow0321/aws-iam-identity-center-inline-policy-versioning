import boto3
import os
from datetime import datetime

codecommit = boto3.client('codecommit')
sso = boto3.client('sso-admin')

def handler(event, context):
    detail = event['detail']
    permission_set_arn = detail['requestParameters']['permissionSetArn']
    instance_arn = detail['requestParameters']['instanceArn']
    repo_name = os.environ.get('REPO_NAME', 'iam-identity-center-policies')
    
    ps_response = sso.describe_permission_set(
        InstanceArn=instance_arn,
        PermissionSetArn=permission_set_arn
    )
    permission_set_name = ps_response['PermissionSet']['Name']
    
    policy_response = sso.get_inline_policy_for_permission_set(
        InstanceArn=instance_arn,
        PermissionSetArn=permission_set_arn
    )
    
    policy = policy_response['InlinePolicy']
    timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H-%M-%S')
    
    try:
        branch = codecommit.get_branch(repositoryName=repo_name, branchName='main')
        parent_commit_id = branch['branch']['commitId']
    except codecommit.exceptions.BranchDoesNotExistException:
        parent_commit_id = None
    
    put_file_params = {
        'repositoryName': repo_name,
        'branchName': 'main',
        'fileContent': policy,
        'filePath': f'{permission_set_name}/{timestamp}.json',
        'commitMessage': f'Policy update for {permission_set_name}',
        'name': 'IAM Identity Center Policy Versioner',
        'email': 'policy-versioner@example.com'
    }
    
    if parent_commit_id:
        put_file_params['parentCommitId'] = parent_commit_id
    
    codecommit.put_file(**put_file_params)
