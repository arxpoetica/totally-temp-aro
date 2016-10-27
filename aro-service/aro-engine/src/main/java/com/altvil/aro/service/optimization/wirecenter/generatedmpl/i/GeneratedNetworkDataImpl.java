package com.altvil.aro.service.optimization.wirecenter.generatedmpl.i;

import com.altvil.aro.service.optimization.wirecenter.generated.GeneratedNetworkData;
import com.vividsolutions.jts.geom.Geometry;

public class GeneratedNetworkDataImpl implements GeneratedNetworkData {

	private String id ;
	private Geometry geometry ;
	
	public GeneratedNetworkDataImpl(String id, Geometry geometry) {
		super();
		this.id = id;
		this.geometry = geometry;
	}

	@Override
	public String getId() {
		return id ;
	}

	@Override
	public Geometry getGeometry() {
		return geometry ;
	}

}
