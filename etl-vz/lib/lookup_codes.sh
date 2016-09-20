#!/bin/bash

state_code_lookup() {
	declare -n __result=$1
	declare  state_code=$2

	declare -A STATE_FIPS_ARRAY=( [fl]=12 [il]=17 [mo]=29 [wa]=53 [wi]=55 ) ;

	__result=${STATE_FIPS_ARRAY[$state_code]} ;
	
	return 0
}


export -f state_code_lookup ;


tower_code_lookup() {
	declare -n __result=$1
	declare  tower_code=$2

	declare -A TOWER_DATA_FILES=( [towers_seattle_wa]=vz_wa_towers [towers_columbus_oh]=vz_oh_towers [towers_mo]=vz_mo_towers [towers_wi]=vz_wi_towers )

	__result=${TOWER_DATA_FILES[$tower_code]} ;
	
	return 0
}

export -f tower_code_lookup ;


cran_code_lookup() {
	declare -n __result=$1
	declare  state=$2

	declare -A CRAN_CODES=( [mo]=mo [wa]=wa_v2 [wi]=wi_v2 )

	__result=${CRAN_CODES[$state]} ;
	
	return 0
}

export -f cran_code_lookup; 

