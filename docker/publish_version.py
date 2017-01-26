#!/usr/bin/python

# Update appropriate version in dynamodb to be called by other components during deployment

import boto3
import botocore.exceptions
from boto3.session import Session
import sys
import os
import pprint
import argparse

parser = argparse.ArgumentParser(description="Parse arguments.")
parser.add_argument('environment', metavar='E', type=str)
parser.add_argument('component', metavar='C', type=str)
parser.add_argument('version', metavar='V', type=str)
args = parser.parse_args()


aws_region = 'us-east-1'
versioning_table = 'aro_versioning'

aro_environment = args.environment
aro_component = args.component
component_version = args.version


db_client = boto3.client('dynamodb', region_name=aws_region)

response = db_client.update_item(
  TableName=versioning_table,
  Key={
    'environment': {
      'S' : aro_environment
    }
  },
  UpdateExpression='SET #aroComponent = :componentVersion',
  ExpressionAttributeNames={
    '#aroComponent': aro_component
  },
  ExpressionAttributeValues={
    ':componentVersion':{
      'S': component_version
    }
  }
)