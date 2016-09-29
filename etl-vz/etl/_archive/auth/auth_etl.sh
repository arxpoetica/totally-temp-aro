#!/bin/bash
set -e;


PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Create auth.users table
${PSQL} -a -f $DIR/create_auth_users.sql

# Create auth.permissions table
${PSQL} -a -f $DIR/create_auth_permissions.sql