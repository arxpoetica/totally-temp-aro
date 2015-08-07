#!/bin/bash

export PGBIN=/usr/bin
PSQL=${PGBIN}/psql

${PSQL} -c "DROP SCHEMA IF EXISTS infousa CASCADE;"
${PSQL} -c "CREATE SCHEMA infousa;"