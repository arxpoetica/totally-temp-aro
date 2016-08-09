#!/bin/sh

# Container build script
APP_SOURCE_ROOT=$(cd "$(dirname "$0")" && pwd)/..

# install application npm dependencies
(cd ${APP_SOURCE_ROOT}/app && npm install --no-bin-link && npm run build)

