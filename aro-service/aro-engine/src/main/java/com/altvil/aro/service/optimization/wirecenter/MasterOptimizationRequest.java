package com.altvil.aro.service.optimization.wirecenter;

import java.util.Collection;
import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.network.LocationSelectionMode;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.optimization.OptimizationRequest;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.OptimizationMode;

public class MasterOptimizationRequest extends OptimizationRequest {

	private Collection<Integer> wireCenters;
	private final OptimizationMode optimizationMode;

	public static Builder build() {
		return new Builder() ;
	}

	public static class Builder {

		private long planId;
		private int year = 2015;
		private Set<LocationEntityType> locationEntities;
		private FiberNetworkConstraints fiberNetworkConstraints;
		private OptimizationConstraints optimizationConstraints;
		private LocationSelectionMode locationSelectionMode = LocationSelectionMode.SELECTED_LOCATIONS;
		private Set<Integer> wireCenters;
		private OptimizationMode optimizationMode;


		public Builder setOptimizationConstraints(
				OptimizationConstraints constraints) {
			this.optimizationConstraints = constraints;
			return this;
		}

		public Builder setFiberNetworkConstraints(
				FiberNetworkConstraints constraints) {
			this.fiberNetworkConstraints = constraints;
			return this;
		}

		public Builder setWirecenters(Set<Integer> wireCenters) {
			this.wireCenters = wireCenters;
			if( this.wireCenters != null && this.wireCenters.size() > 0 ) {
				this.locationSelectionMode = LocationSelectionMode.ALL_LOCATIONS ;
			}
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

		public Builder setLocationEntities(Set<LocationEntityType> locationEntities) {
			this.locationEntities = locationEntities;
			return this ;
		}

		private NetworkDataRequest createDataRequest() {
			return new NetworkDataRequest(planId, year, locationSelectionMode,
					locationEntities);
		}

		public MasterOptimizationRequest build() {
			return new MasterOptimizationRequest(optimizationConstraints,
					fiberNetworkConstraints, createDataRequest(), wireCenters, optimizationMode);
		}

		public Builder setOptimizationMode(OptimizationMode optimizationMode) {
			this.optimizationMode = optimizationMode;
			return this;
		}


	}

	public MasterOptimizationRequest(
			OptimizationConstraints optimizationConstraints,
			FiberNetworkConstraints constraints, NetworkDataRequest request,
			Collection<Integer> wireCenters, OptimizationMode optimizationMode) {
		super(optimizationConstraints, constraints, request);
		this.wireCenters = wireCenters;
		this.optimizationMode = optimizationMode;
	}

	public Collection<Integer> getWireCenters() {
		return wireCenters;
	}

	public OptimizationMode getOptimizationMode() {
		return optimizationMode;
	}
}
