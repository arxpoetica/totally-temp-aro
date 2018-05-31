#!/usr/bin/python

# Stack creation/update script for aro-app. 
# Shamelessly "borrowed" from cmo

import boto3
import botocore.exceptions
from boto3.session import Session
import os
import string
import sys
from arostack import stack
from arostack import versioning
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
PROJECT_BASE_NAME = {'QA': 'S-ARO-QA-',
                     'PRODUCTION': 'P-ARO-',
                     'STAGING': 'S-ARO-'}
SERVICE_TAG = 'APP'
TEMPLATE_URLS = {
    'QA': 'https://cf-templates.altvil.com.s3.amazonaws.com/S-ARO.template',
    'STAGING': 'https://cf-templates.altvil.com.s3.amazonaws.com/S-ARO.template',
    'PRODUCTION': 'https://cf-templates.altvil.com.s3.amazonaws.com/P-ARO.template'
}

if environment == 'PROD':
    TEMPLATE_FILE = os.path.dirname(__file__) + '/P-ARO-template.yml'
elif environment == 'QA':
    TEMPLATE_FILE = os.path.dirname(__file__) + '/S-ARO-QA-template.yml'
else:
    TEMPLATE_FILE = os.path.dirname(__file__) + '/debug-template.json' 
with open(TEMPLATE_FILE, 'r') as template_file:
    TEMPLATE_BODY=template_file.read()

# Config from environment
branch_name = os.environ['CIRCLE_BRANCH'].translate(string.maketrans('_', '-'))
build_num = os.environ['CIRCLE_BUILD_NUM']

aro_etl_image_name = os.environ.get('ARO_ETL_IMAGE_NAME') or 'aro/aro-etl'
aro_app_image_name = os.environ.get('ARO_APP_IMAGE_NAME') or 'aro/aro-app'
aro_service_image_name = os.environ.get('ARO_SERVICE_IMAGE_NAME') or 'aro/aro-service'
aro_app_image_version = os.environ['CIRCLE_BUILD_NUM']
aro_nginx_image_name = os.environ.get('ARO_NGINX_IMAGE_NAME') or 'aro/aro-app-nginx'

domain_name = os.environ.get('ARO_APP_CLIENT_DOMAIN')
aro_client = os.environ.get('ARO_CLIENT') or 'aro'
env_slug = branch_name
name_component = os.environ.get('ARO_APP_NAME_COMPONENT') if environment == 'PROD' else branch_name
decrypt_key = os.environ.get('ARO_APP_DECRYPT_KEY')
token_key = os.environ.get('ARO_APP_TOKEN_KEY')
db_user = os.environ.get('ARO_APP_DB_USER') or 'aro'
db_pass = os.environ.get('ARO_APP_DB_PASS')
db_database = os.environ.get('ARO_APP_DB_DATABASE') or 'aro'
docker_pass = os.environ.get('DOCKER_PASS')
github_ssh_key = os.environ['ARO_APP_OPSWORKS_SSH_KEY']
aws_region = os.environ.get('AWS_REGION') or 'us-east-1'
ecr_uri_root = os.environ.get('ECR_URI_ROOT')
aro_environment = os.environ.get('ARO_ENVIRONMENT') or 'ait-master'

aro_etl_image_version = versioning.get_component_version(environment=aro_environment, component='etl') 
aro_nginx_image_version = versioning.get_component_version(environment=aro_environment, component='nginx') 
aro_service_image_version = versioning.get_component_version(environment=aro_environment, component='service') 

session = Session(region_name='us-east-1')

cloudformation_stack_name = PROJECT_BASE_NAME[environment] + name_component
# host_name = domain_name + '.aro.app.altvil.com' if environment == 'PRODUCTION' else branch_name + '.aro.staging.app.altvil.com'

if environment == 'PRODUCTION':
    host_name = domain_name + 'aro.app.altvil.com'
elif environment == 'STAGING': 
    host_name = branch_name + '.aro.staging.app.altvil.com'
else:
    host_name = branch_name + '.aro.qa.app.altvil.com'
app_base_url = 'https://' + host_name

db_host = os.environ.get('ARO_DB_HOST')

cloudformation_client = boto3.client('cloudformation', region_name='us-east-1')
cloudformation = session.resource('cloudformation')
cloudformation_stack = cloudformation.Stack(cloudformation_stack_name)
opsworks_client = boto3.client('opsworks', region_name='us-east-1')
opsworks = session.resource('opsworks')
logs_client = boto3.client('logs', region_name='us-east-1')
iam_client = boto3.client('iam', region_name='us-east-1')
cloudwatch_client = boto3.client('cloudwatch', region_name='us-east-1')

def create_new_stack():
    """Create a new Staging CloudFormation stack (and OpsWorks stack)"""
    parameters = {
        # 'RdsFlag': 'yes',
        'DBUsername': db_user,
        'DBPassword': db_pass,
        # 'StackBranchName': branch_name,
        # 'StackDomainName': branch_name + '.aro',
        # 'StackContainerVersion': build_num,
        # 'GithubSshKey': github_ssh_key,
        # 'DockerRegistryPassword': docker_pass,
        # 'ProjectBaseName': PROJECT_BASE_NAME[environment],
        # 'ServiceTag': SERVICE_TAG,
        # 'DeployRecipe': 'aro_app_compose',
        # 'ExtraInternalPort': '8088'
        'ClientSlug': name_component,
        'EnvSlug': env_slug,
        'ProjectTag': PROJECT_TAG,
        'AroClient': aro_client,
        'GithubSshKey': github_ssh_key
    }
    if environment == 'PRODUCTION':
        parameters.update({
            'ClientDomainName': domain_name,
            'StackDomainName': domain_name + '.aro',
            'ClientSlug': client_slug,
            'NameComponent': name_component
        })
        print "Stack creation parameters:"
        pprint.pprint(parameters)
        proceed = raw_input("Proceed? (y/N)").lower() == 'y'
    else:
        proceed = True

    if proceed:
        return stack.create_aro_cfn_stack(
            cloudformation_stack_name,
            environment=environment,
            parameters=parameters,
            tags={
                'Project': PROJECT_TAG
            },
            template_body=TEMPLATE_BODY,
            #template_urls=TEMPLATE_URLS,
            cloudformation_client=cloudformation_client
        )
    else:
        print "Operation canceled by user."
        exit(0)

def provision_stack(cloudformation_stack):
    """Provision and start a newly created QA OpsWorks stack."""
    real_name_component = branch_name if environment == 'staging' else name_component
    stack.provision_aro_stack(
        aws_region=aws_region,
        opsworks_stack_id=stack.get_cfn_stack_output(cloudformation_stack, 'Stack'),
        opsworks_manager_layer_id=stack.get_cfn_stack_output(cloudformation_stack, 'ManagerLayer'),
        opsworks_ignite_layer_id=stack.get_cfn_stack_output(cloudformation_stack, 'IgniteLayer'),
        rds_instance_identifier=stack.get_cfn_stack_output(cloudformation_stack, 'RDSInstance') if SERVICE_TAG == 'SERVICE' else 'None',
        environment=environment,
        name='ARO-' + SERVICE_TAG,
        name_component=real_name_component,
        db={'user': db_user, 'pass': db_pass},
        environment_vars=_set_environment(),
        start_stack=True,
        # initialize_database = True if (environment == 'qa' and SERVICE_TAG == 'service') else False,
        initialize_database = False,
        opsworks_client=opsworks_client,
        logs_client=logs_client,
        iam_client= iam_client,
        ignite_instance_type='c4.xlarge',
        manager_instance_type='t2.large'
    )


def update_stack(outputs):
    """Update a previously created and provisioned OpsWorks stack"""
    # disable alarms
    http_alarm = cloudformation_stack_name + '-HTTP-5XX-alarm'
    elb_alarm = cloudformation_stack_name + '-ELB-5XX-alarm'
    cloudwatch_client.disable_alarm_actions(AlarmNames=[http_alarm, elb_alarm])
    # deploy
    stack.deploy_aro_stack(
        aws_region=aws_region,
        opsworks_stack_id=stack.get_cfn_stack_output(cloudformation_stack, 'Stack'),
        environment_vars=_set_environment(),
        opsworks_client=opsworks_client
    )
    # re-enable alarms
    cloudwatch_client.enable_alarm_actions(AlarmNames=[http_alarm, elb_alarm])

def _set_environment():
    """ returns a list of hashes of environment variables """
    return [{ 'Key': 'aro_etl_container_tag', 'Value': str(aro_etl_image_version), 'Secure': False },
            { 'Key': 'aro_etl_image_name', 'Value': str(aro_etl_image_name), 'Secure': False },
            { 'Key': 'aro_service_container_tag', 'Value': str(aro_service_image_version), 'Secure': False },
            { 'Key': 'aro_service_image_name', 'Value': str(aro_service_image_name), 'Secure': False },
            { 'Key': 'aro_app_container_tag', 'Value': str(aro_app_image_version), 'Secure': False },
            { 'Key': 'aro_app_image_name', 'Value': str(aro_app_image_name), 'Secure': False },
            { 'Key': 'aro_nginx_container_tag', 'Value': str(aro_nginx_image_version), 'Secure': False },
            { 'Key': 'aro_nginx_image_name', 'Value': str(aro_nginx_image_name), 'Secure': False },
            { 'Key': 'aro_client', 'Value': str(aro_client), 'Secure': False },
            { 'Key': 'APP_BASE_URL', 'Value': str(app_base_url), 'Secure': False },
            { 'Key': 'AWS_REGION', 'Value': "us-east-1", 'Secure': False },
            { 'Key': 'ecr_uri_root', 'Value': str(ecr_uri_root), 'Secure': False } ]




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
    except botocore.exceptions.ClientError:
        if environment == 'PROD':
            print "Stack does not exist, cannot update."
        elif environment == 'STAGING' or environment == 'QA':
            print "Stack does not exist; creating instead."
            opsworks_stack = create_new_stack()
            provision_stack(opsworks_stack)
        sys.exit(0)

    update_stack(outputs)
    sys.exit(0)