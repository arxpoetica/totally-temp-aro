package com.altvil.netop.plan;

public class SelectedRegion {

	private AroAnalysisRegionType regionType;
	private String id;
	private String wkt;

	public AroAnalysisRegionType getRegionType() {
		return regionType;
	}

	public void setRegionType(AroAnalysisRegionType regionType) {
		this.regionType = regionType;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getWkt() {
		return wkt;
	}

	public void setWkt(String wkt) {
		this.wkt = wkt;
	}

}
