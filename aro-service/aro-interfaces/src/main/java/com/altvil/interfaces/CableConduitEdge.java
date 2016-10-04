package com.altvil.interfaces;

public interface CableConduitEdge  {
	
	Long getEdgeId() ;
	CableConstructionEnum getCableConstructionEnum() ;
	double getStartRatio() ;
	double getEndRatio() ;
	
	
	boolean isValid() ;
	
	CableConduitEdge expandHigher(double ratio) ;
	CableConduitEdge expandLower(double ratio) ;
	CableConduitEdge splitLower(double ratio) ;
	CableConduitEdge splitHigher(double ratio) ;

}
