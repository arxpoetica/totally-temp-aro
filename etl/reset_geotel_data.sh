#!/bin/bash

export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

${PSQL} -c "DROP SCHEMA IF EXISTS geotel CASCADE;"
${PSQL} -c "CREATE SCHEMA geotel;"