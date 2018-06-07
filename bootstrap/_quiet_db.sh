#!/bin/bash

psql -c "ALTER USER ${PGUSER} SET client_min_messages = warning;"
