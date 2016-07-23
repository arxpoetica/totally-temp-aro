package com.altvil.aro.service.graph.segment.transform;

import com.altvil.aro.service.graph.segment.GeoSegment;

public class TransformFactory {
	
	public static final TransformFactory FACTORY = new TransformFactory() ;

	public SplitTransform createSplitTransform(double ratioOffset,
			GeoSegment parent) {
		return null;
	}
	
	public FlippedTransform createFlippedTransform(GeoSegment parent) {
		return null ;
	}

}
