#!/bin/bash
set -e;

PSQL="${PGBIN}/psql -v ON_ERROR_STOP=1"
GISROOT=/gisdata
TMPDIR=/gisdata/temp/
UNZIPTOOL=unzip
export AWS_DEFAULT_REGION=us-east-1

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

# Use upper case state names. FIPS codes unnecessary here as well.
IFS=',' read -a STATE_ARRAY <<< "${STATE_CODES}"
TARGET_SCHEMA_NAME='nbm'

cd $GISROOT;
for STATE_CODE in "${STATE_ARRAY[@]}"
do
	STATE="${STATE_CODE^^}"
	rm -f ${TMPDIR}/*.*

	if [ ! -f $GISROOT/${STATE}-NBM-CBLOCK-CSV-JUN-2014.zip ]; then
		wget http://www.broadbandmap.gov/download/${STATE}-NBM-CSV-June-2014.zip --accept=zip --reject=html -nd -nc
		$UNZIPTOOL ${STATE}-NBM-CSV-June-2014.zip -d ${TMPDIR}
		${PSQL} -a -c "SELECT create_nbm_blocks_table('${STATE}', '${TARGET_SCHEMA_NAME}');"
		$UNZIPTOOL -p ${TMPDIR}/${STATE}-NBM-CSV-June-2014/${STATE}-NBM-CBLOCK-CSV-JUN-2014.zip | ${PSQL} -a -c "COPY ${TARGET_SCHEMA_NAME}.blocks_${STATE} FROM STDIN DELIMITER '|' CSV HEADER;"
		${PSQL} -a -c "SELECT create_nbm_blocks_indexes('${STATE}', '${TARGET_SCHEMA_NAME}');"
		${PSQL} -a -c "SELECT create_competitor_speed_category_partition('${STATE}', '${TARGET_SCHEMA_NAME}');"
		${PSQL} -a -c "SELECT load_competitor_speed_category_partition('${STATE}', '${TARGET_SCHEMA_NAME}');"
		rm -rf ${TMPDIR}/${STATE}-NBM-CSV-June-2014
	fi
done

${PSQL} -a -f $DIR/brand_strength.sql


