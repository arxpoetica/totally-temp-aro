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
export PSQL="${PGBIN}/psql "

echo '' > ${ETL_LOG_FILE}

# exec 3>&1 1>>${ETL_LOG_FILE} 2>&1  # this works but isn't giving me stderror on the console
exec 3>&1 1>>${ETL_LOG_FILE} 2> >(tee /dev/fd/3)  # I think it works, though psql is still too chatty 

source ${DIR}/../db/lib/lookup_codes.sh

if [ -z "$STATE_CODES" ]; then
  export STATE_CODES='uk'
fi

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

cd $DIR/../db

(cd etl/schema && make etl_reload_auth) # this is a hack for now

make reset_schema
psql -c "CREATE EXTENSION IF NOT EXISTS hstore;" # this is also a hack. for some reason resetting the schema drops this extension.
psql -c "CREATE EXTENSION IF NOT EXISTS unaccent;" # this is also a hack. for some reason resetting the schema drops this extension.
psql -c "CREATE EXTENSION IF NOT EXISTS "\"uuid-ossp\"";" # this is also a hack. for some reason resetting the schema drops this extension.
make load_schema

make reset_uk_stage_public
make load_uk_stage_public

make reset_view
make load_view

make reset_uk_public
make load_uk_public

make refresh_materialized_view

node ../app/cli/register_user -f Admin -l User -e $ADMIN_USER_EMAIL -p $ADMIN_USER_PASSWORD -r admin
