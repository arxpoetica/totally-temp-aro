#!/bin/bash

# script to run stack ops for aro

action=$1
env_type=$2
DIR=`dirname $0`

if [ $action = 'create' ] || [ $action = 'update' ]; then
    if [ $env_type = 'prod' ] && [ $action = 'create' ]; then
        echo "Sorry, production creates are currently not supported in the cmo app.  Please go to AWS."
        exit 0
    else
        python $DIR/create_or_update_stack.py $env_type $action
    fi
elif [ $action = 'delete' ]; then
    python $DIR/delete_staging_stack.py $env_type
else
    echo "please specify either 'create', 'update', or 'delete'"
    exit 1  # exit with error
fi