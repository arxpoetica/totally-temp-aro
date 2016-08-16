#!/usr/bin/python

# Stack creation/update script for aro-app. 
# Shamelessly "borrowed" from cmo

import boto3
import botocore.exceptions
from boto3.session import Session
import os
import string
import sys
from trustack import stack
import pprint
import argparse

parser = argparse.ArgumentParser(description="Parse env type for deleting a stack.")
parser.add_argument('env_type', metavar='E', type=str)
parser.add_argument('action', metavar='A', type=str)
args = parser.parse_args()
environment = args.env_type.upper()
action = args.action.upper()
if environment not in {'QA','STAGING','PROD'}:
    raise StandardError('%s is not a valid environment tag.' % (environment,))
if action not in {'CREATE', 'UPDATE'}:
    raise StandardError('%s is not a valid action to take.' % action)

PROJECT_TAG = 'AIT:ARO'
PROJECT_BASE_NAME = {'QA': 'S-CMO-APP-QA-',
                     'PRODUCTION': 'P-CMO-APP-',
                     'STAGING': 'S-ARO-APP-'}
SERVICE_TAG = 'aro-app'
TEMPLATE_URLS = {
    'QA': 'https://cf-templates.altvil.com.s3.amazonaws.com/S-ARO.template',
    'STAGING': 'https://cf-templates.altvil.com.s3.amazonaws.com/S-ARO.template',
    'PRODUCTION': 'https://cf-templates.altvil.com.s3.amazonaws.com/P-ARO.template'
}

# Config from environment
branch_name = os.environ['CIRCLE_BRANCH'].translate(string.maketrans('_', '-'))
build_num = os.environ['CIRCLE_BUILD_NUM']
data_image_version = os.environ.get('ARO_APP_DATA_VERSION')
nginx_image_version = 5 # current
domain_name = os.environ.get('ARO_APP_CLIENT_DOMAIN')
env_slug = os.environ.get('ARO_APP_ENV_SLUG') 
name_component = os.environ.get('ARO_APP_NAME_COMPONENT') if environment == 'PROD' else branch_name
decrypt_key = os.environ.get('ARO_APP_DECRYPT_KEY')
token_key = os.environ.get('ARO_APP_TOKEN_KEY')
db_user = os.environ.get('ARO_APP_DB_USER') or 'aro'
db_pass = os.environ.get('ARO_APP_DB_PASS')
docker_pass = os.environ['DOCKER_PASS']
github_ssh_key = os.environ['ARO_APP_OPSWORKS_SSH_KEY']

session = Session(region_name='us-east-1')

cloudformation_stack_name = PROJECT_BASE_NAME[environment] + name_component
host_name = domain_name + '.aro.app.altvil.com' if environment == 'PRODUCTION' else branch_name + '.aro.staging.app.altvil.com'

cloudformation_client = boto3.client('cloudformation', region_name='us-east-1')
cloudformation = session.resource('cloudformation')
cloudformation_stack = cloudformation.Stack(cloudformation_stack_name)
opsworks_client = boto3.client('opsworks', region_name='us-east-1')
opsworks = session.resource('opsworks')
logs_client = boto3.client('logs', region_name='us-east-1')
iam_client = boto3.client('iam', region_name='us-east-1')
cloudwatch_client = boto3.client('cloudwatch', region_name='us-east-1')

def create_new_stack():
    """Create a new QA CloudFormation stack"""
    parameters = {
        'IfAttachDB': 'True',
        'IfAttachCache': 'False',
        'DBUsername': db_user,
        'DBPassword': db_pass,
        'StackBranchName': branch_name,
        'StackDomainName': branch_name + '.aro',
        'StackContainerVersion': build_num,
        'GithubSshKey': github_ssh_key,
        'DockerRegistryPassword': docker_pass,
        'ProjectBaseName': PROJECT_BASE_NAME[environment],
        'ServiceTag': SERVICE_TAG,
        'DeployRecipe': 'aro_app_compose',
        'ExtraInternalPort': '8088'
        
    }
    if environment == 'PRODUCTION':
        parameters.update({
            'ClientDomainName': domain_name,
            'StackDomainName': domain_name + '.cmo',
            'ClientSlug': client_slug,
            'NameComponent': name_component
        })
        print "Stack creation parameters:"
        pprint.pprint(parameters)
        proceed = raw_input("Proceed? (y/N)").lower() == 'y'
    else:
        proceed = True

    if proceed:
        return stack.create_cmo_cfn_stack(
            cloudformation_stack_name,
            environment=environment,
            parameters=parameters,
            tags={
                'Name': cloudformation_stack_name,
                'Project': PROJECT_TAG,
                'Branch': branch_name,
                'Build': build_num
            },
            template_urls=TEMPLATE_URLS,
            cloudformation_client=cloudformation_client
        )
    else:
        print "Operation canceled by user."
        exit(0)

def provision_stack(cloudformation_stack):
    """Provision and start a newly created QA CloudFormation stack."""
    real_name_component = branch_name if environment == 'QA' else name_component
    stack.provision_cmo_stack(
        opsworks_stack_id=stack.get_cfn_stack_output(cloudformation_stack, 'Stack'),
        opsworks_layer_id=stack.get_cfn_stack_output(cloudformation_stack, 'Layer'),
        internal_layer_id=stack.get_cfn_stack_output(cloudformation_stack, 'ExtraInternalLayer'),
        rds_instance_identifier=stack.get_cfn_stack_output(cloudformation_stack, 'RDSInstance'),
        environment=environment,
        name='CMO-APP',
        name_component=real_name_component,
        db={'user': db_user, 'pass': db_pass},
        docker_pass=docker_pass,
        environment_vars=_set_environment(),
        start_stack=True,
        opsworks_client=opsworks_client,
        logs_client=logs_client,
        iam_client= iam_client,
        instance_type='c4.xlarge'
    )


def update_stack(outputs):
    """Update a previously created and provisioned stack"""
    # disable alarms
    http_alarm = cloudformation_stack_name + '-HTTP-5XX-alarm'
    elb_alarm = cloudformation_stack_name + '-ELB-5XX-alarm'
    cloudwatch_client.disable_alarm_actions(AlarmNames=[http_alarm, elb_alarm])
    # deploy
    stack.deploy_cmo_stack(
        opsworks_stack_id=stack.get_cfn_stack_output(cloudformation_stack, 'Stack'),
        docker_pass=docker_pass,
        environment_vars=_set_environment(),
        opsworks_client=opsworks_client
    )
    # re-enable alarms
    cloudwatch_client.enable_alarm_actions(AlarmNames=[http_alarm, elb_alarm])

def _set_environment():
    """ returns a list of hashes of environment variables """
    return [{ 'Key': 'app_container_tag', 'Value': str(build_num), 'Secure': False },
            { 'Key': 'data_container_tag', 'Value': str(data_image_version), 'Secure': False },
            { 'Key': 'nginx_container_tag', 'Value': str(nginx_image_version), 'Secure': False },
            { 'Key': 'decrypt_key', 'Value': str(decrypt_key), 'Secure': True },
            { 'Key': 'token_key', 'Value': str(token_key), 'Secure': True },
            { 'Key': 'client_slug', 'Value': str(client_slug), 'Secure': False },
            { 'Key': 'host_name', 'Value': str(host_name), 'Secure': False }]


if action == 'CREATE':
    try:
        outputs = cloudformation_stack.outputs
    except botocore.exceptions.ClientError:
        opsworks_stack = create_new_stack()
        provision_stack(opsworks_stack)
        sys.exit(0)

    print "Stack already exists."
    resp = raw_input("Would you like to update it? (y/N)")
    if resp.lower() == 'y':
        update_stack(outputs)
    sys.exit(0)

if action == 'UPDATE':
    try:
        outputs = cloudformation_stack.outputs
    except botocore.exceptionsClientError:
        if environment == 'PROD':
            print "Stack does not exist, cannot update."
        elif environment == 'QA':
            print "Stack does not exist; creating instead."
            opsworks_stack = create_new_stack()
            provision_stack(opsworks_stack)
        sys.exit(0)

    update_stack(outputs)
    sys.exit(0)