#!/usr/bin/python

# Get component versions from dynamodb to use during deployment

import boto3
import botocore.exceptions
from boto3.session import Session
import pprint

aws_region = 'us-east-1'
versioning_table = 'aro_versioning'

def get_component_version(environment, component):
  """
  Given an environment and component, look up the environment in dynamodb and return the version of the component
  """
  
  db_client = boto3.client('dynamodb', region_name=aws_region)

  response = db_client.get_item(
    TableName=versioning_table,
    Key={
      'environment': {
        'S' : environment
      }
    }
  )
  if component in response['Item'].keys():
    version = response['Item'][component]['S']
    return version
  else:
    return 
  