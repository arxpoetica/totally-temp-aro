#!/bin/bash

state_code_lookup() {
	declare -n __result=$1
	declare  state_code=$2

	declare -A STATE_FIPS_ARRAY=( [fl]=12 [il]=17 [mo]=29 [wa]=53 [wi]=55 ) ;

	__result=${STATE_FIPS_ARRAY[$state_code]} ;
	
	return 0
}


#declare -A STATE_FIPS_ARRAY=( [FL]=12 [IL]=17 [MO]=29 [WA]=53 [WI]=55 )

export -f state_code_lookup ;
export STATE_CODES='fl,il,mo,wa,wi' ;


tower_code_lookup() {
	declare -n __result=$1
	declare  tower_code=$2

	declare -A TOWER_DATA_FILES=( [towers_seattle_wa]=vz_wa_towers [towers_columbus_oh]=vz_oh_towers [towers_mo]=vz_mo_towers [towers_wi]=vz_wi_towers )

	__result=${TOWER_DATA_FILES[$tower_code]} ;
	
	return 0
}

export -f tower_code_lookup ;
export TOWER_CODES='towers_seattle_wa,towers_columbus_oh,towers_mo,towers_wi' ;


cran_code_lookup() {
	declare -n __result=$1
	declare  state=$2

	declare -A CRAN_CODES=( [mo]=mo [wa]=wa_v2 [wi]=wi_v2 )

	__result=${CRAN_CODES[$state]} ;
	
	return 0
}

declare -a CRAN_STATES=( 'mo' 'wa' 'wi' )
