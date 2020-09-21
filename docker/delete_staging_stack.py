import boto3
from boto3.session import Session
import botocore.exceptions
import os, sys
from arostack import stack_kill
import pprint
import argparse
pp = pprint.PrettyPrinter(indent=4)

parser = argparse.ArgumentParser(description="Parse env type for deleting a stack.")
parser.add_argument('env_type', metavar='E', type=str)
args = parser.parse_args()

environment = args.env_type.upper()
PROJECT_BASE_NAME = {'QA': 'S-ARO-QA-APP-',
                     'PRODUCTION': 'P-ARO-APP-',
                     'STAGING': 'S-ARO-APP-'}
branch_name = os.environ['CIRCLE_BRANCH']
cloudformation_stack_name = PROJECT_BASE_NAME[environment] + branch_name

session = Session(region_name='us-east-1')
cloudformation_client = boto3.client('cloudformation', region_name='us-east-1')
cloudformation = session.resource('cloudformation')
cloudformation_stack = cloudformation.Stack(cloudformation_stack_name)

opsworks_client = boto3.client('opsworks', region_name='us-east-1')
opsworks = session.resource('opsworks')


print "You are attempting to delete stack %s with the following specs: \n" % cloudformation_stack_name
pp.pprint(cloudformation_client.describe_stacks(StackName=cloudformation_stack_name))
resp = raw_input("This can't be undone. Continue? (YES/no [no]):  ")

if resp == 'YES':
    try:
        stack_kill.stack_kill(cloudformation_stack=cloudformation_stack,
                              opsworks_client=opsworks_client,
                              cloudformation_client=cloudformation_client,
                              stack_name=cloudformation_stack_name)
    except botocore.exceptions.ClientError:
        print "Something went wrong."
        sys.exit(0)
else:
    print "Stack delete aborted."