#!/usr/bin/python

# Stack creation/update script for aro-app.

import boto3
from boto3.session import Session
from botocore.exceptions import ClientError
import pprint
import time

# Config Constants
AWS_ACCOUNT_ID = '976168524097'  # avco
# ARN of the group that should be granted Manage rights on the stack
DEVELOPER_GROUP_NAME = 'truplan-developers'
DEVELOPER_GROUP_ARN = 'arn:aws:iam::976168524097:group/' + DEVELOPER_GROUP_NAME
CREATE_POLL_INTERVAL = 10  # seconds
# This seems like a really long time but in fact RDS instance creation is very slow
CREATE_TIMEOUT = 1200  # seconds


def get_cfn_stack_output(stack, key):
    """
    From a boto3 CloudFormation stack object, get the value of the output with the
    given key. Yield None if no such output exists.
    """
    if not stack.outputs:
        return None
    else:
        candidates = [o['OutputValue'] for o in stack.outputs if o['OutputKey'] == key]
        if not candidates:
            return None
        else:
            return candidates[0]


def aws_hashify(m, key_key='Key', value_key='Value'):
    """Convert a map to an array of {KeyKey:ValueKey:} pairs."""
    return [{key_key: k, value_key: v} for (k, v) in m.iteritems()]


# def add_developer_group_to_stack(stack_id, opsworks_client, iam_client, environment='PRODUCTION'):
#     """
#     Given an OpsWorks stack id, add the members of the TruPlan developers group to it with
#     'Manage' and 'ssh/sudo' permissions enabled. Sadly we cannot attach the group itself; we
#     must attach individual users.
#     """
#     permission_level = 'manage' if environment == 'QA' else 'deploy'
#     group_response = iam_client.get_group(GroupName=DEVELOPER_GROUP_NAME)
#     if 'Users' not in group_response:
#         raise StandardError("no Users in response to IAM group call: %s"
#                             % pprint.pformat(group_response))
#     for user in group_response['Users']:
#         opsworks_client.set_permission(
#             StackId=stack_id,
#             IamUserArn=user['Arn'],
#             AllowSsh=True,
#             AllowSudo=True,
#             Level=permission_level
#         )


def create_aro_cfn_stack(stack_name,
                         environment='staging',
                         parameters={},
                         tags={},
                         # template_urls={},
                         template_body='',
                         cloudformation_client=None):
    """
    Create and return a new ARO CloudFormation stack with the given parameters.
    Polls and prints a status update every CREATE_POLL_INTERVAL seconds.
    Does not return the Stack object until creation is complete and successful.
    :param stack_name: Name to give the new stack.
    :param environment: Environment the new stack inhabits, 'QA' or 'PRODUCTION'.
    :param parameters: Hash of parameters to provide for stack init.
    :param tags: Hash of tags to attach to stack.
    :param cloudformation_client: CloudFormation client to use, or None if we should
           make a new one.
    :return: CloudFormation.Stack object describing the new stack.
    """
    cloudformation_client = cloudformation_client or boto3.client('cloudformation', region_name='us-east-1')
    session = Session(region_name='us-east-1')
    cloudformation = session.resource('cloudformation')

    create_response = cloudformation_client.create_stack(
        StackName=stack_name,
        # TemplateURL=template_urls[environment],
        TemplateBody=template_body,
        Parameters=aws_hashify(parameters, key_key='ParameterKey', value_key='ParameterValue'),
        TimeoutInMinutes=CREATE_TIMEOUT/60,
        Capabilities=[
            'CAPABILITY_IAM'
        ],
        Tags=aws_hashify(tags)
    )

    # Poll for stack success
    stack_id = create_response['StackId']
    if not stack_id:
        raise StandardError(create_response)
    cloudformation_stack = cloudformation.Stack(stack_name)

    create_delay = 0
    while create_delay <= CREATE_TIMEOUT:
        print "Sleeping for %d seconds (%d so far) for stack startup..." \
            % (CREATE_POLL_INTERVAL, create_delay)
        time.sleep(CREATE_POLL_INTERVAL)
        create_delay += CREATE_POLL_INTERVAL
        cloudformation_stack.reload()
        status = cloudformation_stack.stack_status
        if status == 'CREATE_COMPLETE':
            print "...create successful!"
            break
        elif status != 'CREATE_IN_PROGRESS':
            print "...failed! (%s)" % status
            raise StandardError(status)

    if create_delay >= CREATE_TIMEOUT:
        print "...ran out of time, CloudFormation will roll back the stack."
        raise StandardError("Create timeout exhausted")

    return cloudformation_stack


def get_stack_name(environment, name, name_component):
    name_bases = {
        'QA': 'S-{0}-QA-{1}'.format(name, name_component),
        'STAGING': 'S-{0}-{1}'.format(name, name_component),
        'PRODUCTION': 'P-{0}-{1}'.format(name, name_component)
    }
    return name_bases[environment]


def provision_aro_stack(opsworks_stack_id=None,
                        opsworks_layer_id=None,
                        internal_layer_id=None,
                        rds_instance_identifier=None,
                        environment='STAGING',
                        name='',
                        name_component='',
                        db={},
                        docker_pass='',
                        environment_vars=[],
                        start_stack=False,
                        opsworks_client=None,
                        logs_client=None,
                        iam_client=None,
                        instance_type=''):
    """Provision a newly created CloudFormation stack by hooking up the app and RDS"""
    opsworks_client = opsworks_client or boto3.client('opsworks', region_name='us-east-1')
    logs_client = logs_client or boto3.client('logs', region_name='us-east-1')
    iam_client = iam_client or boto3.client('iam', region_name='us-east-1')

    # Attach RDS instance to OpsWorks stack if provided
    if db:
        rds_instance_arn = "arn:aws:rds:us-east-1:%s:db:%s" % (AWS_ACCOUNT_ID, rds_instance_identifier)
        rds_response = opsworks_client.register_rds_db_instance(
            StackId=opsworks_stack_id,
            RdsDbInstanceArn=rds_instance_arn,
            DbUser=db['user'],
            DbPassword=db['pass']
        )

    # Add an app and an instance
    data_sources = [
            { 'Type': 'RdsDbInstance',
              'Arn': rds_instance_arn,
              'DatabaseName': db.get('name') or 'aro' }
        ] if db else []
    app_response = opsworks_client.create_app(
        StackId=opsworks_stack_id,
        Shortname='aro-docker',
        Name='aro-docker',
        DataSources=data_sources,
        Type='other',
        EnableSsl=False,
        Environment=[ { 'Key': 'registry_password', 'Value': docker_pass, 'Secure': True } ] + environment_vars
    )
    ids = [opsworks_layer_id, internal_layer_id]
    instance_response = opsworks_client.create_instance(
        StackId=opsworks_stack_id,
        LayerIds=[id for id in ids if id],
        InstanceType=instance_type
    )

    # Add the log group with its retention policy to cloudwatch logs
    lg_name = get_stack_name(environment, name, name_component)
    try:
        log_group_response = logs_client.create_log_group(
            logGroupName=lg_name
        )
        retention_policy_response = logs_client.put_retention_policy(
            logGroupName=lg_name,
            retentionInDays=60
        )
    except ClientError:  # assume it already exists :p
        pass

    # add_developer_group_to_stack(opsworks_stack_id, opsworks_client, iam_client, environment)

    if start_stack:
        print "Starting stack..."
        start_response = opsworks_client.start_stack(StackId=opsworks_stack_id)

    # Here is where we need to initialize the database

    # First run a loop that continually polls the status of the instance using opsworks_client.describe_instances 
    # Status should progress through `requested`, `pending`, `booting`, `running_setup`, until reaching `running`
    # Any error along the way will generate a failure. Successful attainment of `running` status proceeds 

    # Run the opsworks/chef recipe that will handle the various commands required to configure the database and run ETL
    # I don't think we should wait for a response from this command, since it can take over an hour to run



def deploy_aro_stack(opsworks_stack_id=None,
                     docker_pass='',
                     environment_vars=[],
                     opsworks_client=None):
    """Update a previously created and provisioned stack"""
    opsworks_client = opsworks_client or boto3.client('opsworks', region='us-east-1')

    apps_response = opsworks_client.describe_apps(StackId=opsworks_stack_id)
    app_id = apps_response['Apps'][0]['AppId']
    update_response = opsworks_client.update_app(
        AppId=app_id,
        Environment=[ { 'Key': 'registry_password', 'Value': docker_pass, 'Secure': True } ] + environment_vars
    )

    deploy_response = opsworks_client.create_deployment(
        StackId=opsworks_stack_id,
        AppId=app_id,
        Command={
            'Name': 'deploy'
        }
    )
    return deploy_response

