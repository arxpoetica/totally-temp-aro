#!/bin/bash

export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

${PSQL} -c "DROP SCHEMA IF EXISTS demographics CASCADE;"
${PSQL} -c "CREATE SCHEMA demographics;"