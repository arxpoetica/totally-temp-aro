#!/usr/bin/python

# Stack destroy script

import boto3
import time
import stack

TIMEOUT=1200
DELETE_INST_INTERVAL=10

def destroy_instances(opsworks_stack_id=None,
                      opsworks_client=None):
    '''
    Destroys the images attached to a stack
    :param opsworks_stack_id:  {string}
    :param opsworks_client: boto3 client
    :return: None
    '''
    client = opsworks_client or boto3.client('opsworks', region='us-east-1')
    instances_response = client.describe_instances(StackId=opsworks_stack_id)

    instances = []
    # stop all instances
    for inst in instances_response['Instances']:
        id = inst['InstanceId']
        instances.append(id)
        status = inst['Status']
        if status != 'stopped':
            client.stop_instance(InstanceId=id)

    # delete instances as they stop
    delay = 0
    while delay < TIMEOUT:
        time.sleep(DELETE_INST_INTERVAL)
        described_instances = client.describe_instances(InstanceIds=instances)['Instances']
        inst_names = [described_instances[i]['Hostname'] for i in range(len(instances))]
        print "Waiting for instances: %s to stop" % ", ".join(i for i in inst_names)

        for inst in described_instances:
            status = inst['Status']
            name = inst['Hostname']
            id = inst['InstanceId']
            if status == 'stopped':
                client.delete_instance(InstanceId=id, DeleteVolumes=True)
                print "Instance %s deleted!" % name
                instances.remove(id)

        # when all are stopped
        if not instances:
            break

        delay += DELETE_INST_INTERVAL
        if delay >= TIMEOUT:
            raise StandardError("Delete timeout exhausted!")

    print "All instances have been deleted from stack."


def destroy_app(opsworks_stack_id=None,
                opsworks_client=None):
    '''
    Destroys the app attached to a stack
    :param opsworks_stack_id: {string}
    :param opsworks_client: boto3 client
    :return: None
    '''

    client = opsworks_client or boto3.client('opsworks', region='us-east-1')
    apps_response = client.describe_apps(StackId=opsworks_stack_id)
    for app in apps_response['Apps']:
        app_id = app['AppId']
        client.delete_app(AppId=app_id)
    print "All apps have been destroyed."


def destroy_stack(stack_name=None,
                  cloudformation_client=None):
    '''
    Destroys a cloudformation stack after its resources have been killed.
    :param stack: {string}
    :param cloudformation_client: boto3 client
    :return:  None
    '''

    client = cloudformation_client or boto3.client('cloudformation', region_name='us-east-1')
    client.delete_stack(StackName=stack_name)
    print "Success. Now beginning stack delete."


def stack_kill(cloudformation_stack=None,
               opsworks_client=None,
               cloudformation_client=None,
               stack_name=''):
    '''
    Top level method, runs all stack resource destroys and then deletes stack
    :param cloudformation_stack: stack to be destroyed
    :param opsworks_client: boto3 client for opsworks
    :param cloudformation_client: boto3 client for cloudformation
    :param stack_name: {string}
    :return: None
    '''
    print "Beginning stack destroy..."
    opsworks_stack_id = stack.get_cfn_stack_output(cloudformation_stack, 'Stack')

    # destroy all instances
    destroy_instances(
        opsworks_stack_id=opsworks_stack_id,
        opsworks_client=opsworks_client)

    # destroy the existing app
    destroy_app(opsworks_stack_id=opsworks_stack_id,
                opsworks_client=opsworks_client)

    # shut down the stack
    destroy_stack(stack_name=stack_name,
                  cloudformation_client=cloudformation_client)