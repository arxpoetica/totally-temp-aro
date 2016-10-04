#!/bin/bash

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from
export ETL_LOG_FILE=$DIR/etl.log
export PGBIN=/usr/bin

echo '' > ${ETL_LOG_FILE}

# exec 3>&1 1>>${ETL_LOG_FILE} 2>&1  # this works but isn't giving me stderror on the console
# exec 2>&1 1>>${ETL_LOG_FILE} | tee -a ${ETL_LOG_FILE} # doesn't work
# exec 1>>${ETL_LOG_FILE} 2> >(tee -a ${ETL_LOG_FILE} >&2) # sorta works but makes a mess and loses my "normal" output

exec 3>&1 1>>${ETL_LOG_FILE} 2> >(tee /dev/fd/3)  # I think it works, though psql is too chatty 

. $DIR/../db/lib/dev_codes.sh

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

cd $DIR/../db

# make reset_schema
# make load_schema

# make reset_stage_reference
# make stage_reference

# make reset_view
# make load_view

# make reset_stage_private
# make stage_private

make reset_private
make load_private