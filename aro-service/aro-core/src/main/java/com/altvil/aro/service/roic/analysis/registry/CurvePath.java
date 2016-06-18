package com.altvil.aro.service.roic.analysis.registry;


public interface CurvePath {

	public boolean isLastElement() ;
	public String nextElement() ;
	public CurveIdentifier nextCurveIdentifier() ;
	boolean isEmpty() ;
	
}
