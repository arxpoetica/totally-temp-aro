package com.altvil.aro.service.roic.analysis.registry;

import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;

public interface CurvePath {

	public boolean isLastElement() ;
	public String nextElement() ;
	public CurveIdentifier nextCurveIdentifier() ;
	boolean isEmpty() ;
	
}
