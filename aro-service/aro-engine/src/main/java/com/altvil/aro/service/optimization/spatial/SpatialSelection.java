package com.altvil.aro.service.optimization.spatial;

import java.io.Serializable;

@SuppressWarnings("serial")
public class SpatialSelection implements Serializable {

	private SpatialRegionType spatialRegionType;
	private int spatialId;
	
	public SpatialSelection(SpatialRegionType spatialRegionType, int spatialId) {
		super();
		this.spatialRegionType = spatialRegionType;
		this.spatialId = spatialId;
	}

	public SpatialRegionType getSpatialRegionType() {
		return spatialRegionType;
	}

	public int getSpatialId() {
		return spatialId;
	}

}
