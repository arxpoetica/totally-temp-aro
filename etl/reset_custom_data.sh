#!/bin/bash

export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

${PSQL} -c "DROP SCHEMA IF EXISTS custom CASCADE;"
${PSQL} -c "CREATE SCHEMA custom;"