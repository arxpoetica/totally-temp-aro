#!/bin/sh

# Container build script
APP_SOURCE_ROOT=$(cd "$(dirname "$0")" && pwd)/..
APP_TARGET=${APP_SOURCE_ROOT}/target

# copy content into target directory
mkdir -p ${APP_TARGET}
for d in app conf etl-aro init ; do
    cp -r ${APP_SOURCE_ROOT}/${d} ${APP_TARGET}
done
for s in runserver.sh circle.yml ; do
    cp ${APP_SOURCE_ROOT}/${s} ${APP_TARGET}
done
for s in cmo.ini Dockerfile ; do
    cp ${APP_SOURCE_ROOT}/docker/${s} ${APP_TARGET}
done

# install application npm dependencies
(cd ${APP_TARGET}/app && npm install --no-bin-link && npm run build)

