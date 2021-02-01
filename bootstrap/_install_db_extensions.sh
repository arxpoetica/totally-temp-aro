#!/bin/bash

psql -c "CREATE EXTENSION IF NOT EXISTS  postgis;"
psql -c "CREATE EXTENSION IF NOT EXISTS  hstore;"
psql -c "CREATE EXTENSION IF NOT EXISTS  fuzzystrmatch;"
psql -c "CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;"
psql -c "CREATE EXTENSION IF NOT EXISTS  \"uuid-ossp\";"
