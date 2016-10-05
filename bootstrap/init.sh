#!/bin/bash

if [ $# -ne 2 ]; then
    echo $0: usage: init.sh admin_user_email admin_user_password
    exit 1
fi

ADMIN_USER_EMAIL=$1
ADMIN_USER_PASSWORD=$2


DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from
export ETL_LOG_FILE=$DIR/etl.log
export PGBIN=/usr/bin

echo '' > ${ETL_LOG_FILE}

# exec 3>&1 1>>${ETL_LOG_FILE} 2>&1  # this works but isn't giving me stderror on the console
exec 3>&1 1>>${ETL_LOG_FILE} 2> >(tee /dev/fd/3)  # I think it works, though psql is still too chatty 

source ${DIR}/../db/lib/lookup_codes.sh

export STATE_CODES='wa' ;
export CRAN_CODES='wa';
export TOWER_CODES='towers_seattle_wa' ;
export SHP_FIBER_CODES='wa'


DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

cd $DIR/../db

(cd etl/schema && make etl_reload_auth) # this is a hack for now

make reset_schema
make load_schema

make reset_stage_reference
make stage_reference

make reset_view
make load_view

make reset_stage_private
make stage_private

make reset_private
make load_private

node ../app/cli/register_user -f Admin -l User -e $ADMIN_USER_EMAIL -p $ADMIN_USER_PASSWORD -r admin