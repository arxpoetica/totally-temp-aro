#!/bin/bash

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Create custom.route table
${PSQL} -a -f $DIR/create_custom_route.sql

# Create custom.route_sources table
${PSQL} -a -f $DIR/create_custom_route_sources.sql

# Create custom.route_targets table
${PSQL} -a -f $DIR/create_custom_route_targets.sql

# Create custom.route_edges table
${PSQL} -a -f $DIR/create_custom_route_edges.sql
