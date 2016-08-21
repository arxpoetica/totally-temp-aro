package com.altvil.netop.optimize;

import java.util.ArrayList;
import java.util.List;

import com.altvil.aro.service.network.AnalysisSelectionMode;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.AlgorithmType;
import com.altvil.enumerations.OptimizationMode;
import com.altvil.enumerations.OptimizationType;

public class AroOptimizationPlan {

	private long planId = 0;

	private OptimizationType algorithm = OptimizationType.UNCONSTRAINED;
	private AnalysisSelectionMode analysisSelectionMode = AnalysisSelectionMode.SELCTION_AREAS;
	private OptimizationMode optimizationMode = OptimizationMode.INTER_WIRECENTER;
	private AlgorithmType algorithmType = AlgorithmType.DEFAULT;
	private Double threshold;

	private FinancialConstraints financialConstraints;
	private FiberNetworkConstraints fiberNetworkConstraints;
	private List<AroLocationEntityType> locationTypes = new ArrayList<>();

	private List<Integer> processLayers = new ArrayList<Integer>();

	public long getPlanId() {
		return planId;
	}

	public List<Integer> getProcessLayers() {
		return processLayers;
	}

	public void setProcessLayers(List<Integer> processLayers) {
		this.processLayers = processLayers;
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

	public AnalysisSelectionMode getAnalysisSelectionMode() {
		return analysisSelectionMode;
	}

	public void setAnalysisSelectionMode(
			AnalysisSelectionMode analysisSelectionMode) {
		this.analysisSelectionMode = analysisSelectionMode;
	}

	public void setLocationTypes(List<AroLocationEntityType> locationTypes) {
		this.locationTypes = locationTypes;
	}

	public OptimizationMode getOptimizationMode() {
		return optimizationMode;
	}

	public void setOptimizationMode(OptimizationMode optimizationMode) {
		this.optimizationMode = optimizationMode;
	}

	public AlgorithmType getAlgorithmType() {
		return algorithmType;
	}

	public void setAlgorithmType(AlgorithmType algorithmType) {
		this.algorithmType = algorithmType;
	}

}
