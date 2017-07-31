#!/bin/bash


psql -c "CREATE EXTENSION postgis;"
psql -c "CREATE EXTENSION fuzzystrmatch;"
psql -c "CREATE EXTENSION \"uuid-ossp\";"
