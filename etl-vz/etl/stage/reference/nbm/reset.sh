#!/bin/bash
set -e;


export PGBIN=/usr/bin
PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

${PSQL} -c "DROP SCHEMA IF EXISTS nbm CASCADE;"
${PSQL} -c "CREATE SCHEMA nbm;"

# Load functions for NBM table operations
${PSQL} -a -f $DIR/create_nbm_blocks.sql

# Create this master table (this is schema...) using a new function created above
${PSQL} -a -c "SELECT create_competitor_speed_category_master_table('nbm');"