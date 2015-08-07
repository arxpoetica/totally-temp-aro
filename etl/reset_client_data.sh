#!/bin/bash

PSQL=${PGBIN}/psql

${PSQL} -c "DROP SCHEMA IF EXISTS client CASCADE;"
${PSQL} -c "CREATE SCHEMA client;"