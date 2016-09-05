package com.altvil.aro.service.optimization.wirecenter;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;

import com.altvil.aro.model.MasterPlan;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.network.AnalysisSelectionMode;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.optimization.OptimizationRequest;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.AlgorithmType;
import com.altvil.enumerations.OptimizationMode;

public class RootOptimizationRequest extends OptimizationRequest {

	private final OptimizationMode optimizationMode;
	private Collection<Integer> processingLayers = new ArrayList<>() ;

	public static Builder build() {
		return new Builder();
	}

	public static class Builder {

		private static final Collection<Integer> DEFAULT_PROCESSING_LAYERS = Collections
				.singleton(new Integer(1));

		private double mrc = 0.0;
		private long planId;
		private int year = 2015;
		private Collection<Integer> processingLayers = DEFAULT_PROCESSING_LAYERS;

		private AlgorithmType algorithmType;

		private Set<LocationEntityType> locationEntities;
		private FiberNetworkConstraints fiberNetworkConstraints;
		private OptimizationConstraints optimizationConstraints;
		private AnalysisSelectionMode locationSelectionMode = AnalysisSelectionMode.SELECTED_LOCATIONS;
		private OptimizationMode optimizationMode;

		public Builder setOptimizationConstraints(
				OptimizationConstraints constraints) {
			this.optimizationConstraints = constraints;
			return this;
		}

		public Builder setAnalysisSelectionMode(
				AnalysisSelectionMode analysisSelectionMode) {
			this.locationSelectionMode = analysisSelectionMode;
			return this;
		}

		public Builder setAlgorithmType(AlgorithmType algorithmType) {
			this.algorithmType = algorithmType;
			return this;
		}

		public Builder setProcessingLayers(Collection<Integer> processingLayers) {
			this.processingLayers = processingLayers;
			return this;
		}

		public Builder setFiberNetworkConstraints(
				FiberNetworkConstraints constraints) {
			this.fiberNetworkConstraints = constraints;
			return this;
		}

		public Builder setPlanId(long planId) {
			this.planId = planId;
			return this;
		}

		public Builder setYear(Integer year) {
			if (year != null) {
				this.year = year;
			}
			return this;
		}

		public Builder setLocationEntities(
				Set<LocationEntityType> locationEntities) {
			this.locationEntities = locationEntities;
			return this;
		}

		private NetworkDataRequest createDataRequest() {
			return new NetworkDataRequest(planId, null, year,
					locationSelectionMode, locationEntities, mrc, false);
		}

		public RootOptimizationRequest build() {
			return new RootOptimizationRequest(processingLayers,
					optimizationConstraints, fiberNetworkConstraints,
					createDataRequest(), optimizationMode, algorithmType);
		}

		public Builder setMrc(double mrc) {
			this.mrc = mrc;
			return this;
		}

		public Builder setOptimizationMode(OptimizationMode optimizationMode) {
			this.optimizationMode = optimizationMode;
			return this;
		}

	}

	public RootOptimizationRequest(Collection<Integer> processingLayers,
			OptimizationConstraints optimizationConstraints,
			FiberNetworkConstraints constraints, NetworkDataRequest request,
			OptimizationMode optimizationMode, AlgorithmType algorithmType) {
		super(optimizationConstraints, constraints, request, algorithmType);
		this.processingLayers = processingLayers;
		this.optimizationMode = optimizationMode;
	}

	public MasterOptimizationRequest toMasterOptimizationRequest(
			MasterPlan masterPlan, Set<LocationEntityType> types) {
		return new MasterOptimizationRequest(masterPlan.getServiceLayer(),
				optimizationConstraints, constraints,
				networkDataRequest.createRequest(masterPlan.getId(), masterPlan
						.getServiceLayer().getId()).createRequest(types), optimizationMode,
				algorithmType);
	}

	public Collection<Integer> getProcessingLayers() {
		return processingLayers;
	}

	public OptimizationMode getOptimizationMode() {
		return optimizationMode;
	}

}
