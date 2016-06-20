package com.altvil.aro.service.roic;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.RowReference;

public interface RoicQueryService {
	
	Collection<RowReference> queryRoic(Long planId, Collection<String> curveNames) ;

}
