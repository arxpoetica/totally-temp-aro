package com.altvil.aro.service.plan;

import java.io.Serializable;

public class FiberNetworkConstraints implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private Integer fdtCount;

	private Integer splitterRatio;

	private Integer minSplitters;
	private Integer idealSplitters;
	private Integer maxSplitters;

	private Double dropCableLengthInFeet;
	private Double preferredCableLengthInFeet;
	private Double maxDistrubitionLengthInFeet;
	
	private Boolean clusterMergingSupported ;
	private Boolean dropCableConstraintsSupported ;

	public FiberNetworkConstraints() {
		// TODO Auto-generated constructor stub
	}

	public Integer getFdtCount() {
		return fdtCount;
	}

	public void setFdtCount(Integer fdtCount) {
		this.fdtCount = fdtCount;
	}

	public Integer getSplitterRatio() {
		return splitterRatio;
	}

	public void setSplitterRatio(Integer splitterRatio) {
		this.splitterRatio = splitterRatio;
	}

	public Integer getMinSplitters() {
		return minSplitters;
	}

	public void setMinSplitters(Integer minSplitters) {
		this.minSplitters = minSplitters;
	}

	public Integer getIdealSplitters() {
		return idealSplitters;
	}

	public void setIdealSplitters(Integer idealSplitters) {
		this.idealSplitters = idealSplitters;
	}

	public Integer getMaxSplitters() {
		return maxSplitters;
	}

	public void setMaxSplitters(Integer maxSplitters) {
		this.maxSplitters = maxSplitters;
	}

	public Double getDropCableLengthInFeet() {
		return dropCableLengthInFeet;
	}

	public void setDropCableLengthInFeet(Double dropCableLengthInFeet) {
		this.dropCableLengthInFeet = dropCableLengthInFeet;
	}

	public Double getMaxDistrubitionLengthInFeet() {
		return maxDistrubitionLengthInFeet;
	}

	public void setMaxDistrubitionLengthInFeet(
			Double maxDistrubitionLengthInFeet) {
		this.maxDistrubitionLengthInFeet = maxDistrubitionLengthInFeet;
	}

	public Double getPreferredCableLengthInFeet() {
		return preferredCableLengthInFeet;
	}

	public void setPreferredCableLengthInFeet(Double preferredCableLengthInFeet) {
		this.preferredCableLengthInFeet = preferredCableLengthInFeet;
	}

	public Boolean getClusterMergingSupported() {
		return clusterMergingSupported;
	}

	public void setClusterMergingSupported(Boolean clusterMergingSupported) {
		this.clusterMergingSupported = clusterMergingSupported;
	}

	public Boolean getDropCableConstraintsSupported() {
		return dropCableConstraintsSupported;
	}

	public void setDropCableConstraintsSupported(
			Boolean dropCableConstraintsSupported) {
		this.dropCableConstraintsSupported = dropCableConstraintsSupported;
	}
	
	

}