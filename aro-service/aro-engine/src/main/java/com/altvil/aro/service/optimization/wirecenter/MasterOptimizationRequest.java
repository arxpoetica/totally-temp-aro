package com.altvil.aro.service.optimization.wirecenter;

import java.util.Collection;
import java.util.Collections;
import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.network.AnalysisSelectionMode;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.optimization.OptimizationRequest;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.AlgorithmType;
import com.altvil.enumerations.OptimizationMode;

public class MasterOptimizationRequest extends OptimizationRequest {

	private final OptimizationMode optimizationMode;
	private Collection<Integer> processingLayers;

	public static Builder build() {
		return new Builder();
	}

	public static class Builder {
		
		private static final Collection<Integer> DEFAULT_PROCESSING_LAYERS = Collections.singleton(new Integer(1)) ;

		private long planId;
		private int year = 2015;
		private Collection<Integer> processingLayers = DEFAULT_PROCESSING_LAYERS;
	
		private AlgorithmType algorithmType ;
		
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
		
		public Builder setAnalysisSelectionMode(AnalysisSelectionMode analysisSelectionMode) {
			this.locationSelectionMode = analysisSelectionMode ;
			return this ;
		}

		public Builder setAlgorithmType(AlgorithmType algorithmType) {
			this.algorithmType = algorithmType;
			return this;
		}

		public Builder setProcessingLayers(Collection<Integer> processingLayers) {
			if( processingLayers != null && processingLayers.size() > 0 ) {
				this.processingLayers = processingLayers;
			}
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
			return new NetworkDataRequest(planId, year, locationSelectionMode,
					locationEntities);
		}

		public MasterOptimizationRequest build() {
			return new MasterOptimizationRequest(processingLayers,
					optimizationConstraints, fiberNetworkConstraints,
					createDataRequest(), optimizationMode,
					algorithmType);
		}

		public Builder setOptimizationMode(OptimizationMode optimizationMode) {
			this.optimizationMode = optimizationMode;
			return this;
		}

	}

	public MasterOptimizationRequest(Collection<Integer> processingLayers,
			OptimizationConstraints optimizationConstraints,
			FiberNetworkConstraints constraints, NetworkDataRequest request,
			OptimizationMode optimizationMode, AlgorithmType algorithmType) {
		super(optimizationConstraints, constraints, request, algorithmType);
		this.processingLayers = processingLayers;
		this.optimizationMode = optimizationMode;
	}
	
	public Collection<Integer> getProcessingLayers() {
		return processingLayers;
	}

	
	public OptimizationMode getOptimizationMode() {
		return optimizationMode;
	}
}
