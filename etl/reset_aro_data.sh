#!/bin/bash

PSQL=${PGBIN}/psql

${PSQL} -c "DROP SCHEMA IF EXISTS aro CASCADE;"
${PSQL} -c "CREATE SCHEMA aro;"