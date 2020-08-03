#!/bin/bash

if [ $# -lt 2 ]; then
    echo $0: usage: init.sh admin_user_email admin_user_password [state_codes]
    exit 1
fi

ADMIN_USER_EMAIL=$1
ADMIN_USER_PASSWORD=$2

if [ $# -eq 3 ]; then
  export STATE_CODES=$3
fi


DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from
export ETL_LOG_FILE=$DIR/etl.log
export PGBIN=/usr/bin
export PSQL="${PGBIN}/psql "

echo '' > ${ETL_LOG_FILE}

# exec 3>&1 1>>${ETL_LOG_FILE} 2>&1  # this works but isn't giving me stderror on the console
exec 3>&1 1>>${ETL_LOG_FILE} 2> >(tee /dev/fd/3)  # I think it works, though psql is still too chatty

source ${DIR}/../db/lib/lookup_codes.sh

if [ -z "$STATE_CODES" ]; then
  export STATE_CODES='ABW,AFG,AGO,AIA,ALA,ALB,AND,ANT,ARE,ARG,ARM,ASM,ATA,ATF,ATG,AUS,AUT,AZE,BDI,BEL,BEN,BFA,BGD,BGR,BHR,BHS,BIH,BLM,BLR,BLZ,BMU,BOL,BRA,BRB,BRN,BTN,BVT,BWA,CAF,CAN,CCK,CHE,CHL,CHN,CIV,CMR,COD,COG,COK,COL,COM,CPV,CRI,CUB,CXR,CYM,CYP,CZE,DEU,DEU,DJI,DMA,DNK,DOM,DZA,ECU,EGY,ERI,ESH,ESP,EST,ETH,FIN,FJI,FLK,FRA,FRO,FSM,GAB,GBR,GEO,GGY,GHA,GIN,GLP,GMB,GNB,GNQ,GRC,GRD,GRL,GTM,GUF,GUM,GUY,HKG,HMD,HND,HRV,HTI,HUN,IDN,IMN,IND,IOT,IRL,IRN,IRQ,ISL,ISR,ITA,JAM,JEY,JOR,JPN,KAZ,KEN,KGZ,KHM,KIR,KNA,KOR,KWT,LAO,LBN,LBR,LBY,LCA,LIE,LKA,LSO,LTU,LUX,LVA,MAC,MAF,MAR,MCO,MDA,MDG,MDV,MEX,MHL,MKD,MLI,MLT,MMR,MNE,MNG,MNP,MOZ,MRT,MSR,MTQ,MUS,MWI,MYS,MYT,NAM,NCL,NER,NFK,NGA,NIC,NIU,NLD,NOR,NPL,NRU,NZL,OMN,PAK,PAN,PCN,PER,PHL,PLW,PNG,POL,PRI,PRK,PRT,PRY,PSE,PYF,QAT,REU,RKS,ROU,RUS,RWA,SAU,SDN,SEN,SGP,SGS,SHN,SJM,SLB,SLE,SLV,SOM,SPM,SRB,SSD,STP,SUR,SVK,SVN,SWE,SWZ,SYC,SYR,TCA,TCD,TGO,THA,TJK,TKL,TKM,TLS,TON,TTO,TUN,TUR,TUV,TWN,TZA,UGA,UKR,UMI,URY,USA,UZB,VAT,VCT,VEN,VGB,VIR,VNM,VUT,WLF,WSM,YEM,ZAF,ZMB,ZWE'
fi

# SEE Global Instance Data Tracker.xlsx for latest list of supported countries!!!



DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd ) # gets directory the script is running from

cd $DIR/../db

(cd etl/schema && make etl_reload_auth) # this is a hack for now

make reset_schema
psql -c "CREATE EXTENSION IF NOT EXISTS hstore;" # this is also a hack. for some reason resetting the schema drops this extension.
psql -c "CREATE EXTENSION IF NOT EXISTS unaccent;" # this is also a hack. for some reason resetting the schema drops this extension.
psql -c "CREATE EXTENSION IF NOT EXISTS "\"uuid-ossp\"";" # this is also a hack. for some reason resetting the schema drops this extension.
make load_schema

make reset_global_stage_public
make load_global_stage_public

make reset_view
make load_view

make reset_global_public
make load_global_public

make refresh_materialized_view

node ../app/cli/register_user -f Admin -l User -e $ADMIN_USER_EMAIL -p $ADMIN_USER_PASSWORD -r admin
