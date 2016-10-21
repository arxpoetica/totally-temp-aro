package com.altvil.aro.service.optimization.wirecenter;

import java.util.*;

import com.altvil.aro.model.MasterPlan;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.network.AnalysisSelectionMode;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.optimization.OptimizationRequest;
import com.altvil.aro.service.optimization.constraints.*;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.AlgorithmType;
import com.altvil.enumerations.AroOptimizationType;
import com.altvil.enumerations.OptimizationMode;
import com.altvil.enumerations.OptimizationType;
import com.altvil.netop.optimize.FinancialConstraints;

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

		private AlgorithmType algorithmType = null;

		private Set<LocationEntityType> locationEntities;
		private FiberNetworkConstraints fiberNetworkConstraints;
		private AnalysisSelectionMode locationSelectionMode = AnalysisSelectionMode.SELECTED_LOCATIONS;
		private OptimizationMode optimizationMode;
		private boolean usePlanConduit ;
		private OptimizationType optimizationType;
		private FinancialConstraints financials;
		private Double threshold;


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
		
		
		public Builder setUsePlanConduit(boolean usePlanConduit) {
			this.usePlanConduit = usePlanConduit ;
			return this ;
		}

		public Builder setLocationEntities(
				Set<LocationEntityType> locationEntities) {
			this.locationEntities = locationEntities;
			return this;
		}

		private NetworkDataRequest createDataRequest() {
			return new NetworkDataRequest(planId, null, year,
					locationSelectionMode, locationEntities, mrc, false, Optional.<Integer>empty());
		}

		public RootOptimizationRequest build() {
			return new RootOptimizationRequest(processingLayers,
					getOptimizationConstraints(), fiberNetworkConstraints,
					createDataRequest(), optimizationMode, inferAlgorithmType(), usePlanConduit);
		}

		private OptimizationConstraints getOptimizationConstraints() {


			if (financials == null) {
				financials = new FinancialConstraints();
			}

			switch (optimizationType) {

				case IRR:
					return new IrrConstraints(optimizationType,
							financials.getYears(), financials.getDiscountRate(),
							threshold == null ? Double.NaN : threshold, financials.getBudget());

				case COVERAGE:
					return new CoverageConstraints(financials.getYears(),
							financials.getDiscountRate(),
							threshold  == null ? Double.NaN : threshold, financials.getBudget());

				case NPV:

				case PRUNNING_NPV:
					return new NpvConstraints(optimizationType,
							financials.getYears(), financials.getDiscountRate(),
							threshold  == null ? Double.NaN : threshold , financials.getBudget());

				case CAPEX:
					return new CapexConstraints(OptimizationType.CAPEX,
							financials.getYears(), financials.getDiscountRate(),
							Double.NaN, financials.getBudget());

				case UNCONSTRAINED:
				default:
					return new DefaultConstraints(OptimizationType.UNCONSTRAINED);

			}

		}
		private AlgorithmType inferAlgorithmType() {

			if (algorithmType != AlgorithmType.DEFAULT) {
				return algorithmType;
			}

			if (algorithmType == null) {
				return AlgorithmType.PLANNING;
			}

			switch (optimizationType) {
				case PRUNNING_NPV:
				case NPV:
					return AlgorithmType.EXPANDED_ROUTING;
				case COVERAGE:
				case IRR:
				case PRUNNING_CAPEX:
					return AlgorithmType.PRUNING;
				case CAPEX:
				case UNCONSTRAINED:
				default:
					return AlgorithmType.PLANNING;
			}
		}
		

		public Builder setMrc(double mrc) {
			this.mrc = mrc;
			return this;
		}

		public Builder setOptimizationMode(OptimizationMode optimizationMode) {
			this.optimizationMode = optimizationMode;
			return this;
		}

		public Builder setOptimizationType(AroOptimizationType optimizationType) {
			this.optimizationType = toOptimizationType(optimizationType);
			return this;
		}

		private OptimizationType toOptimizationType(AroOptimizationType optimizationType) {
			switch (optimizationType){
				case UNCONSTRAINED:
					return OptimizationType.UNCONSTRAINED;
				case SUPER_LAYER_ROUTING:
					return OptimizationType.SUPER_LAYER_ROUTING;

				case CAPEX:
					return OptimizationType.CAPEX;

				case COVERAGE:
					return OptimizationType.COVERAGE;

				case IRR:
					return OptimizationType.IRR;
				case PRUNNING_CAPEX:
					return OptimizationType.PRUNNING_CAPEX;

				case NPV:
					return OptimizationType.NPV;
				case PRUNNING_NPV:
					return OptimizationType.PRUNNING_NPV;
				default:
					throw new RuntimeException("Unknown AroOptimizationType " + optimizationType);
			}
		}


		public Builder setThreshold(Double threshold) {
			this.threshold = threshold;
			return this;
		}


	}

	public RootOptimizationRequest(Collection<Integer> processingLayers,
			OptimizationConstraints optimizationConstraints,
			FiberNetworkConstraints constraints, NetworkDataRequest request,
			OptimizationMode optimizationMode, AlgorithmType algorithmType, boolean usePlanConduit) {
		super(optimizationConstraints, constraints, request, algorithmType, usePlanConduit);
		this.processingLayers = processingLayers;
		this.optimizationMode = optimizationMode;
	}

	public MasterOptimizationRequest toMasterOptimizationRequest(
			MasterPlan masterPlan, Set<LocationEntityType> types) {
		return new MasterOptimizationRequest(masterPlan.getServiceLayer(),
				optimizationConstraints, constraints,
				networkDataRequest.createRequest(masterPlan.getId(), masterPlan
						.getServiceLayer().getId()).createRequest(types), optimizationMode,
				algorithmType, usePlanConduit);
	}

	public Collection<Integer> getProcessingLayers() {
		return processingLayers;
	}

	public OptimizationMode getOptimizationMode() {
		return optimizationMode;
	}

}
