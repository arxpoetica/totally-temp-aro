package com.altvil.aro.service.optimization.spatial;

import java.io.Serializable;

@SuppressWarnings("serial")
public class AnalysisSelection implements Serializable {

	private SpatialAnalysisType spatialRegionType;
	private int spatialId;
	
	public AnalysisSelection(SpatialAnalysisType spatialRegionType, int spatialId) {
		super();
		this.spatialRegionType = spatialRegionType;
		this.spatialId = spatialId;
	}

	public SpatialAnalysisType getSpatialRegionType() {
		return spatialRegionType;
	}

	public int getSpatialId() {
		return spatialId;
	}

}
