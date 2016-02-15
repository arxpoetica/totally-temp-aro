package com.altvil.netop.recalc;

import java.util.List;

public class RawRoute {
	
	private long objectId ;
	private List<RawSegment> rawSegments ;
	
	
	public RawRoute(long objectId, List<RawSegment> rawSegments) {
		super();
		this.objectId = objectId;
		this.rawSegments = rawSegments;
	}
	
	public RawRoute() {
		
	}
	
	public long getObjectId() {
		return objectId;
	}
	public void setObjectId(long objectId) {
		this.objectId = objectId;
	}
	public List<RawSegment> getRawSegments() {
		return rawSegments;
	}
	public void setRawSegments(List<RawSegment> rawSegments) {
		this.rawSegments = rawSegments;
	}
	
	

}
