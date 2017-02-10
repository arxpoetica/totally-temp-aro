#!/bin/bash

if [ $# -lt 2 ]; then
    echo $0: usage: init.sh admin_user_email admin_user_password [state_codes]
    exit 1
fi

ADMIN_USER_EMAIL=$1
ADMIN_USER_PASSWORD=$2

if [ $# -eq 3 ]; then
  export STATE_CODES=$3
fi


DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from
export ETL_LOG_FILE=$DIR/etl.log
export PGBIN=/usr/bin

echo '' > ${ETL_LOG_FILE}

# exec 3>&1 1>>${ETL_LOG_FILE} 2>&1  # this works but isn't giving me stderror on the console
exec 3>&1 1>>${ETL_LOG_FILE} 2> >(tee /dev/fd/3)  # I think it works, though psql is still too chatty 

source ${DIR}/../db/lib/lookup_codes.sh

if [ -z "$STATE_CODES" ]; then
  export STATE_CODES='mh'
fi

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

cd $DIR/../db

(cd etl/schema && make etl_reload_auth) # this is a hack for now

make reset_schema
psql -c "CREATE EXTENSION hstore;" # this is also a hack. for some reason resetting the schema drops this extension.
make load_schema

make reset_stage_reference
make stage_reference

make reset_view
make load_view

make reset_private
make load_private

node ../app/cli/register_user -f Admin -l User -e $ADMIN_USER_EMAIL -p $ADMIN_USER_PASSWORD -r admin