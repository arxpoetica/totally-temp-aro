#!/bin/bash

export PGBIN=/usr/bin
export PGPASSWORD=aro
export PGHOST=localhost
export PGUSER=aro
export PGDATABASE=aro

if [ -z "$ARO_DATA_ROOT" ]; then
    export ARO_DATA_ROOT=/opt/aro-app-data
fi
