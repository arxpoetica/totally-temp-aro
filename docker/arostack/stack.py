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
DEVELOPER_GROUP_NAME = 'aro-developers'
DEVELOPER_GROUP_ARN = 'arn:aws:iam::976168524097:group/' + DEVELOPER_GROUP_NAME
CREATE_POLL_INTERVAL = 10  # seconds
# This seems like a really long time but in fact RDS instance creation is very slow
CREATE_TIMEOUT = 1400  # seconds


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


def add_developer_group_to_stack(stack_id, opsworks_client, iam_client, environment='PRODUCTION'):
    """
    Given an OpsWorks stack id, add the members of the TruPlan developers group to it with
    'Manage' and 'ssh/sudo' permissions enabled. Sadly we cannot attach the group itself; we
    must attach individual users.
    """
    permission_level = 'deploy' if environment == 'QA' else 'deploy'
    group_response = iam_client.get_group(GroupName=DEVELOPER_GROUP_NAME)
    if 'Users' not in group_response:
        raise StandardError("no Users in response to IAM group call: %s"
                            % pprint.pformat(group_response))
    for user in group_response['Users']:
        opsworks_client.set_permission(
            StackId=stack_id,
            IamUserArn=user['Arn'],
            AllowSsh=True,
            AllowSudo=True,
            Level=permission_level
        )


def create_aro_cfn_stack(stack_name,
                         aws_region='',
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
    cloudformation_client = cloudformation_client or boto3.client('cloudformation', region_name=aws_region)
    session = Session(region_name=aws_region)
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


def provision_aro_stack(aws_region='',
                        opsworks_stack_id=None,
                        opsworks_manager_layer_id=None,
                        opsworks_ignite_layer_id=None,
                        rds_instance_identifier=None,
                        environment='STAGING',
                        name='',
                        name_component='',
                        db={},
                        environment_vars=[],
                        start_stack=False,
                        initialize_database=False,
                        opsworks_client=None,
                        logs_client=None,
                        iam_client=None,
                        ignite_instance_type='',
                        manager_instance_type=''):
    """Provision a newly created OpsWorks stack by hooking up the app and RDS"""
    opsworks_client = opsworks_client or boto3.client('opsworks', region_name=aws_region)
    logs_client = logs_client or boto3.client('logs', region_name=aws_region)
    iam_client = iam_client or boto3.client('iam', region_name=aws_region)

    TIMEOUT = 1200
    INSTANCE_CREATE_DELAY = 10

    # Attach RDS instance to OpsWorks stack if provided
    if db:
        rds_instance_arn = "arn:aws:rds:%s:%s:db:%s" % (aws_region, AWS_ACCOUNT_ID, rds_instance_identifier)
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
        Shortname='aro',
        Name='aro',
        DataSources=data_sources,
        Type='other',
        EnableSsl=False,
        Environment=environment_vars
    )
    
    manager_ids = [opsworks_manager_layer_id ]
    manager_instance_response = opsworks_client.create_instance(
        StackId=opsworks_stack_id,
        LayerIds=[id for id in manager_ids if id],
        InstanceType=manager_instance_type
    )

    # ignite_ids = [opsworks_ignite_layer_id ]
    # ignite_instance_response = opsworks_client.create_instance(
    #     StackId=opsworks_stack_id,
    #     LayerIds=[id for id in ignite_ids if id],
    #     InstanceType=ignite_instance_type
    # )

    # Add the log group with its retention policy to cloudwatch logs
    lg_name = get_stack_name(environment, name, name_component)
    try:
        log_group_response = logs_client.create_log_group(
            logGroupName=lg_name
        )
        retention_policy_response = logs_client.put_retention_policy(
            logGroupName=lg_name,
            retentionInDays=30
        )
    except ClientError:  # assume it already exists :p
        pass

    # add_developer_group_to_stack(opsworks_stack_id, opsworks_client, iam_client, environment)

    if start_stack:
        print "Starting stack..."
        start_response = opsworks_client.start_stack(StackId=opsworks_stack_id)

    
        print "Initializing swarm..."

        # First run a loop that continually polls the status of the instance using opsworks_client.describe_instances 
        # Status should progress through `requested`, `pending`, `booting`, `running_setup`, until reaching `online`
        # Any error along the way will generate a failure. Successful attainment of `online` status proceeds 

        # TODO: actually add error handling other than the timeout

        # populate array of instances
        instances_response = opsworks_client.describe_instances(StackId=opsworks_stack_id)
        instances = []
        for inst in instances_response['Instances']:
            id = inst['InstanceId']
            instances.append(id)
        delay = 0
        # start wait loop until they reach 'running' status
        while delay < TIMEOUT:
            print "Sleeping for %d seconds (%d so far) for instance startup..." \
                % (INSTANCE_CREATE_DELAY, delay)
            time.sleep(INSTANCE_CREATE_DELAY)
            described_instances = opsworks_client.describe_instances(InstanceIds=instances)['Instances']
            inst_names = [described_instances[i]['Hostname'] for i in range(len(instances))]
            print "Waiting for instances: %s to reach running status" % ", ".join(i for i in inst_names)

            for inst in described_instances:
                status = inst['Status']
                name = inst['Hostname']
                id = inst['InstanceId']
                if status == 'online':
                    print "Instance %s is online" % name
                    instances.remove(id)

            if not instances:
                break

            delay += INSTANCE_CREATE_DELAY
            if delay >= TIMEOUT:
                raise StandardError("Instance creation timeout exhausted")

        
        # Now that the manager/swarm is created, we can add a processing node        
        ignite_ids = [opsworks_ignite_layer_id ]
        ignite_instance_response = opsworks_client.create_instance(
            StackId=opsworks_stack_id,
            LayerIds=[id for id in ignite_ids if id],
            InstanceType=ignite_instance_type
        )

        # start_response = opsworks_client.start_stack(StackId=opsworks_stack_id)

        # deploy_response = opsworks_client.create_deployment(
        #     StackId=opsworks_stack_id,
        #     AppId=app_response['AppId'],
        #     Command={
        #         'Name': 'deploy',
        #         'Args': {
        #             'recipes' : ['aro_ops::compose-initialize']
        #         }
        #     },
        #     CustomJson="{\"app_initialization\": {\"admin_email\": \"" + app_initial_email + "\", \"admin_password\": \"" + app_initial_password + "\"} }"
        # )
        # return deploy_response



def deploy_aro_stack(aws_region='',
                     opsworks_stack_id=None,
                     environment_vars=[],
                     opsworks_client=None):
    """Update a previously created and provisioned stack"""
    opsworks_client = opsworks_client or boto3.client('opsworks', region='us-east-1')

    apps_response = opsworks_client.describe_apps(StackId=opsworks_stack_id)
    app_id = apps_response['Apps'][0]['AppId']
    update_response = opsworks_client.update_app(
        AppId=app_id,
        Environment=environment_vars
    )

    deploy_response = opsworks_client.create_deployment(
        StackId=opsworks_stack_id,
        AppId=app_id,
        Command={
            'Name': 'deploy'
        }
    )
    return deploy_response

