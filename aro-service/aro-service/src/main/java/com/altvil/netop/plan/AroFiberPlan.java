package com.altvil.netop.plan;

import java.util.ArrayList;
import java.util.List;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.FiberPlanAlgorithm;
import com.altvil.netop.optimize.FinancialConstraints;

public class AroFiberPlan {

	private long planId;

	private FiberPlanAlgorithm algorithm;
	
	private Double threshold ;

	private FinancialConstraints financialConstraints = new FinancialConstraints();
	private FiberNetworkConstraints fiberNetworkConstraints;
	private List<LocationEntityType> locationTypes = new ArrayList<>();
	private List<SelectedRegion> selectedRegions = new ArrayList<>();

	public long getPlanId() {
		return planId;
	}

	public void setPlanId(long planId) {
		this.planId = planId;
	}
	
	
	public Double getThreshold() {
		return threshold;
	}

	public void setThreshold(Double threshold) {
		this.threshold = threshold;
	}

	public FiberPlanAlgorithm getAlgorithm() {
		return algorithm;
	}

	public void setAlgorithm(FiberPlanAlgorithm algorithm) {
		this.algorithm = algorithm;
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
