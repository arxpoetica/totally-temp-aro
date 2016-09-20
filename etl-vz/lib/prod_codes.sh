#!/bin/bash

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
source ${DIR}/lookup_codes.sh

export STATE_CODES='fl,il,mo,wa,wi' ;
export TOWER_CODES='towers_seattle_wa,towers_columbus_oh,towers_mo,towers_wi' ;
export CRAN_CODES='mo,wa,wi';
