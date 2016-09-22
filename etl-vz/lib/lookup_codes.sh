#!/bin/bash

state_code_lookup() {
	declare -n __result=$1
	declare  state_code=$2

	declare -A STATE_FIPS_ARRAY=( [wv]=54 [fl]=12 [il]=17 [mn]=27 [md]=24 [ri]=44 [id]=16 [nh]=33 [nc]=37 [vt]=50 [ct]=09 [de]=10 [nm]=35 [ca]=06 [nj]=34 [wi]=55 [or]=41 [ne]=31 [pa]=42 [wa]=53 [la]=22 [ga]=13 [al]=01 [ut]=49 [oh]=39 [tx]=48 [co]=08 [sc]=45 [ok]=40 [tn]=47 [wy]=56 [hi]=15 [nd]=38 [ky]=21 [mp]=69 [gu]=66 [me]=23 [ny]=36 [nv]=32 [ak]=02 [as]=60 [mi]=26 [ar]=05 [ms]=28 [mo]=29 [mt]=30 [ks]=20 [pr]=72 [sd]=46 [ma]=25 [va]=51 [dc]=11 [ia]=19 [az]=04 [vi]=78 ) ;

	__result=${STATE_FIPS_ARRAY[$state_code]} ;
	
	return 0
}


export -f state_code_lookup ;


tower_code_lookup() {
	declare -n __result=$1
	declare  tower_code=$2

	declare -A TOWER_DATA_FILES=( [towers_seattle_wa]=vz_wa_towers [towers_columbus_oh]=vz_oh_towers [towers_mo]=vz_mo_towers [towers_wi]=vz_wi_towers [towers_il]=vz_il_towers )

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

