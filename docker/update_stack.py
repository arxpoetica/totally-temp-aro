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
PROJECT_BASE_NAME = 'ARO-STACK-'

SERVICE_TAG = 'APP'
# TEMPLATE_URLS = {
#     'QA': 'https://cf-templates.altvil.com.s3.amazonaws.com/S-ARO.template',
#     'STAGING': 'https://cf-templates.altvil.com.s3.amazonaws.com/S-ARO.template',
#     'PRODUCTION': 'https://cf-templates.altvil.com.s3.amazonaws.com/P-ARO.template'
# }

# if environment == 'PROD':
#     TEMPLATE_FILE = os.path.dirname(__file__) + '/P-ARO-template.yml'
# elif environment == 'QA':
#     TEMPLATE_FILE = os.path.dirname(__file__) + '/S-ARO-QA-template.yml'
# else:
#     TEMPLATE_FILE = os.path.dirname(__file__) + '/debug-template.json'
# with open(TEMPLATE_FILE, 'r') as template_file:
#     TEMPLATE_BODY=template_file.read()

# Config from environment
branch_name = os.environ['CIRCLE_BRANCH'].translate(string.maketrans('_', '-'))
build_num = os.environ['CIRCLE_BUILD_NUM']

aro_etl_image_name = os.environ.get('ARO_ETL_IMAGE_NAME') or 'aro/aro-etl'
aro_app_image_name = os.environ.get('ARO_APP_IMAGE_NAME') or 'aro/aro-app'
aro_service_image_name = os.environ.get('ARO_SERVICE_IMAGE_NAME') or 'aro/aro-service'
aro_nginx_image_name = os.environ.get('ARO_NGINX_IMAGE_NAME') or 'aro/aro-app-nginx'
aro_auth_image_name = os.environ.get('ARO_AUTH_IMAGE_NAME') or 'aro/aro-auth'

aro_client = os.environ.get('ARO_CLIENT') or 'aro'
env_slug = branch_name
cloudformation_name_suffix = 'QA' if branch_name == 'master' else 'QA-' + branch_name

db_user = os.environ.get('ARO_APP_DB_USER') or 'aro'
db_pass = os.environ.get('ARO_APP_DB_PASS')
db_database = os.environ.get('ARO_APP_DB_DATABASE') or 'aro'
docker_pass = os.environ.get('DOCKER_PASS')
google_maps_api_key = os.environ.get('GOOGLE_MAPS_API_KEY')
google_maps_api_ip_key = os.environ.get('GOOGLE_MAPS_API_IP_KEY')

aws_region = os.environ.get('AWS_REGION') or 'us-east-1'
ecr_uri_root = os.environ.get('ECR_URI_ROOT')
aro_environment = os.environ.get('ARO_ENVIRONMENT') or 'ait-master'
# this sets the environment to lookup in the versioning table, which determines which build numbers to deploy
aro_environment = 'qa-' + branch_name


aro_etl_image_version = versioning.get_component_version(environment=aro_environment, component='etl')
aro_nginx_image_version = versioning.get_component_version(environment=aro_environment, component='nginx')
aro_service_image_version = versioning.get_component_version(environment=aro_environment, component='service')
aro_app_image_version = versioning.get_component_version(environment=aro_environment, component='app')
aro_auth_image_version = versioning.get_component_version(environment=aro_environment, component='auth')

session = Session(region_name='us-east-1')

cloudformation_stack_name = PROJECT_BASE_NAME + cloudformation_name_suffix

if branch_name == 'master':
    host_name = 'qa.aro.altvil.com'
else:
    host_name = 'qa-' + branch_name + '.aro.altvil.com'

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
            { 'Key': 'aro_auth_container_tag', 'Value': str(aro_auth_image_version), 'Secure': False },
            { 'Key': 'aro_auth_image_name', 'Value': str(aro_auth_image_name), 'Secure': False },
            { 'Key': 'aro_client', 'Value': str(aro_client), 'Secure': False },
            { 'Key': 'APP_BASE_URL', 'Value': str(app_base_url), 'Secure': False },
            { 'Key': 'AWS_REGION', 'Value': "us-east-1", 'Secure': False },
            { 'Key': 'GOOGLE_MAPS_API_KEY', 'Value': str(google_maps_api_key), 'Secure': True },
            { 'Key': 'GOOGLE_MAPS_API_IP_KEY', 'Value': str(google_maps_api_ip_key), 'Secure': True },
            { 'Key': 'ecr_uri_root', 'Value': str(ecr_uri_root), 'Secure': False } ]





# debug block
print "aro_environment: " + aro_environment
print "host_name: " + host_name
print "cloudformation_stack_name: " + cloudformation_stack_name
print "app_base_url: " + app_base_url



if action == 'UPDATE':
    try:
        outputs = cloudformation_stack.outputs
    except botocore.exceptions.ClientError:
        if environment == 'PROD':
            print "Stack does not exist, cannot update."
        elif environment == 'STAGING' or environment == 'QA':
            print "Stack does not exist; figure this out."
            # opsworks_stack = create_new_stack()
            # provision_stack(opsworks_stack)
        sys.exit(0)

    update_stack(outputs)
    sys.exit(0)