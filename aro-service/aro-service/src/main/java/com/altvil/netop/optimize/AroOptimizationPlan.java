package com.altvil.netop.optimize;

import java.util.ArrayList;
import java.util.List;

import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.OptimizationMode;
import com.altvil.enumerations.OptimizationType;
import com.altvil.netop.plan.SelectedRegion;

public class AroOptimizationPlan {

	private int serviceAreaLayer = 1;
	private long planId = 0;

	private OptimizationType algorithm;
	private OptimizationMode optimizationMode = OptimizationMode.INTER_WIRECENTER;
	private Double threshold;

	private FinancialConstraints financialConstraints;
	private FiberNetworkConstraints fiberNetworkConstraints;
	private List<AroLocationEntityType> locationTypes = new ArrayList<>();
	private List<SelectedRegion> selectedRegions = new ArrayList<>();

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

	public Double getThreshold() {
		return threshold;
	}

	public void setThreshold(Double threshold) {
		this.threshold = threshold;
	}

	public List<AroLocationEntityType> getLocationTypes() {
		return locationTypes;
	}

	public void setLocationTypes(List<AroLocationEntityType> locationTypes) {
		this.locationTypes = locationTypes;
	}

	public List<SelectedRegion> getSelectedRegions() {
		return selectedRegions;
	}

	public void setSelectedRegions(List<SelectedRegion> selectedRegions) {
		this.selectedRegions = selectedRegions;
	}

	public OptimizationMode getOptimizationMode() {
		return optimizationMode;
	}

	public void setOptimizationMode(OptimizationMode optimizationMode) {
		this.optimizationMode = optimizationMode;
	}

	public int getServiceAreaLayer() {
		return serviceAreaLayer;
	}

	public void setServiceAreaLayer(int serviceAreaLayer) {
		this.serviceAreaLayer = serviceAreaLayer;
	}

}
