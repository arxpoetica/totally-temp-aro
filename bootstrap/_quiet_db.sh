#!/bin/bash

psql -c "ALTER USER aro SET client_min_messages = warning;"
