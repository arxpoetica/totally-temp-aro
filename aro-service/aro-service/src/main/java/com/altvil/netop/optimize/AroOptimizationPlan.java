package com.altvil.netop.optimize;

import java.util.ArrayList;
import java.util.List;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.OptimizationType;
import com.altvil.netop.plan.SelectedRegion;

public class AroOptimizationPlan {

	private long planId;

	private OptimizationType algorithm;

	private FinancialConstraints financialConstraints;
	private FiberNetworkConstraints fiberNetworkConstraints;
	private List<LocationEntityType> locationTypes = new ArrayList<>();
	private List<SelectedRegion> selectedRegions = new ArrayList<>();

	private Double coverage;
	private Double threshold;

	public long getPlanId() {
		return planId;
	}

	public void setPlanId(long planId) {
		this.planId = planId;
	}

	public OptimizationType getAlgorithm() {
		return algorithm;
	}

	public void setAlgorithm(OptimizationType optimizationType) {
		this.algorithm = optimizationType;
	}

	public FinancialConstraints getFinancialConstraints() {
		return financialConstraints;
	}

	public void setFinancialConstraints(
			FinancialConstraints financialConstraints) {
		this.financialConstraints = financialConstraints;
	}

	public FiberNetworkConstraints getFiberNetworkConstraints() {
		return fiberNetworkConstraints;
	}

	public void setFiberNetworkConstraints(
			FiberNetworkConstraints fiberNetworkConstraints) {
		this.fiberNetworkConstraints = fiberNetworkConstraints;
	}

	public Double getCoverage() {
		return coverage;
	}

	public void setCoverage(Double coverage) {
		this.coverage = coverage;
	}

	public Double getThreshold() {
		return threshold;
	}

	public void setThreshold(Double threshold) {
		this.threshold = threshold;
	}

	public List<LocationEntityType> getLocationTypes() {
		return locationTypes;
	}

	public void setLocationTypes(List<LocationEntityType> locationTypes) {
		this.locationTypes = locationTypes;
	}

	public List<SelectedRegion> getSelectedRegions() {
		return selectedRegions;
	}

	public void setSelectedRegions(List<SelectedRegion> selectedRegions) {
		this.selectedRegions = selectedRegions;
	}

	

}
