package com.altvil.aro.service.graph.segment;

import java.util.Collection;

import com.altvil.aro.service.graph.model.Reversable;

public interface GeoString extends Reversable {

	public interface StringRepresentation{
		
	}
	
	public GeoString splitByOffsetRatios(Collection<Double> ratios) ;
	public double getLengthInMeters() ;
	
	
}
