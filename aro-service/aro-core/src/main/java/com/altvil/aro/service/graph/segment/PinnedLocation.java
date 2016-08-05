package com.altvil.aro.service.graph.segment;

public interface PinnedLocation extends Comparable<PinnedLocation>,
		AroRoadLocation {

	
	public double offsetFrom(PinnedLocation other) ;
	public double getEffectiveOffsetFromEndVertex() ;
	public double getEffectiveOffsetFromStartVertex() ;
	
	
	public double getOffset() ;

	public GeoSegment getGeoSegment();

	public double getOffsetFromStartVertex();

	public double getOffsetFromEndVertex();

	public boolean isAtStartVertex();

	public boolean isAtEndVertex();

	//TODO investigate deprecating this method and replace with createRootGraphPin()
	public PinnedLocation createRootPin();
	

}
