#!/bin/bash

psql -c "CREATE EXTENSION unaccent;"
psql -c "CREATE EXTENSION postgis;"
psql -c "CREATE EXTENSION fuzzystrmatch;"