package com.altvil.aro.service.optimization.impl.type;

import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.service.demand.AroDemandService;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.demand.analysis.spi.EntityDemandMapping;
import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.FinancialInputs;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.entity.SimpleNetworkFinancials;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.AnalysisSelectionMode;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.network.NetworkDataService;
import com.altvil.aro.service.network.impl.DefaultNetworkAssignment;
import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.aro.service.optimization.impl.PlanCommandService;
import com.altvil.aro.service.optimization.spi.ComputeUnitCallable;
import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimization;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.optimization.wirecenter.impl.DefaultOptimizationResult;
import com.altvil.aro.service.plan.NetworkAssignmentModelFactory;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.price.PricingContext;
import com.altvil.aro.service.price.PricingModel;
import com.altvil.aro.service.price.PricingService;
import com.altvil.aro.service.report.PlanAnalysisReportService;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.NetworkAssignmentModel;

@Service
public class NpvPlanningOptimizer  {
	// Locations appear to have a high minimum cost even when their demand and
	// revenue approach zero. In order to remove those minimum costs exclude all
	// locations whose revenue is less than the CUTOFF from the results.
	private static final double CUTOFF = 25;
	
	private final Logger log = LoggerFactory.getLogger(NpvPlanningOptimizer.class.getName());

	@Autowired
	private WirecenterOptimizationService wirecenterOptimizationService;
	@Autowired
	private NetworkDataService networkService;
	@Autowired
	private PricingService pricingService;
	@Autowired
	private PlanCommandService planCommandService ;
	@Autowired
	private AroDemandService aroDemandService;
	@Autowired
	private PlanAnalysisReportService planAnalysisReportService ;
	
	
	public ComputeUnitCallable<WirecenterOptimization<Optional<PlannedNetwork>>> asCommand(
			WirecenterOptimizationRequest request) {
		return () -> {
			try {
				final PricingModel pricingModel = pricingService.getPricingModel("*", new Date(),
						PricingContext.create(request.getConstructionRatios()));
				NetworkDataRequest networkDataRequest = request.getNetworkDataRequest();
				networkDataRequest = networkDataRequest.createRequest(networkDataRequest.getPlanId(), AnalysisSelectionMode.SELCTION_AREAS);
				final NetworkData networkData = networkService.getNetworkData(networkDataRequest);

				OptimizationConstraints optimizationConstraints = request.getOptimizationConstraints();
				NpvPlanningStrategy nps = new NpvPlanningStrategy((ThresholdBudgetConstraint) optimizationConstraints);
				Optional<PlannedNetwork> plan;
				OptimizedPlan optimizedPlan;
				do {
					NetworkData proxyData = proxyData(networkData, nps.nextParametric());
					plan = wirecenterOptimizationService.planNpvNetwork(request, proxyData);
					if (plan.isPresent()) {
						optimizedPlan = planCommandService.summarize(
								planCommandService.reifyPlan(optimizationConstraints, plan.get()));
					} else {
						optimizedPlan = null;
					}
					
				} while (nps.isConverging(optimizedPlan, pricingModel));

				return new DefaultOptimizationResult<>(request, plan);
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
				return new DefaultOptimizationResult<>(request, new OptimizationException(err.getMessage()));
			}
		};
	}

	
	private NetworkData proxyData(NetworkData networkData, double nextParametric) {
		if (nextParametric == 1D) {
			return networkData;
		}

		Map<Long, CompetitiveLocationDemandMapping> parametricCompetitiveLocationDemandMapping = new HashMap<>();

		Collection<NetworkAssignment> selected = networkData.getRoadLocations().getSelectedAssignments();
		NetworkAssignmentModel.Builder factory = new NetworkAssignmentModelFactory();
		
		for (NetworkAssignment rlNetworkAssignment : networkData.getRoadLocations().getAllAssignments()) {
			LocationEntity locationEntity = (LocationEntity) rlNetworkAssignment.getSource();
			Long locationId = locationEntity.getObjectId();

			if (selected.contains(rlNetworkAssignment)) {
				CompetitiveLocationDemandMapping locationDemandMapping = networkData.getCompetitiveDemandMapping()
						.getLocationDemandMapping(locationId);

				assert locationDemandMapping != null;

				factory.add(rlNetworkAssignment, true);

				parametricCompetitiveLocationDemandMapping.put(locationId, locationDemandMapping);
			} else if (nextParametric > 0) {
				CompetitiveLocationDemandMapping locationDemandMapping = networkData.getCompetitiveDemandMapping()
						.getLocationDemandMapping(locationId);
				CompetitiveLocationDemandMapping parametricLocationDemandMapping = new CompetitiveLocationDemandMapping(
						locationDemandMapping.getBlockId(), locationDemandMapping.getCompetitiveStrength());
				
				double totalRevenue = 0;

				for (LocationEntityType value : LocationEntityType.values()) {
					EntityDemandMapping entityDemandMapping = locationDemandMapping.getEntityDemandMapping(value);

					final double scaledRevenue = entityDemandMapping.getMappedRevenue() * nextParametric;
					parametricLocationDemandMapping.add(value, entityDemandMapping.getMappedDemand() * nextParametric,
							scaledRevenue);
					totalRevenue += scaledRevenue;
				}

				if (totalRevenue > CUTOFF) {
					// NOTE:The fair share mapping is cached so do NOT use the
					// parametric mapping in the call to
					// createFairShareDemandMapping.
					LocationDemand parametricLocationDemand = aroDemandService
							.createFairShareDemandMapping(locationDemandMapping)
							.getFairShareLocationDemand(SpeedCategory.cat7)
							.createLocationDemand(parametricLocationDemandMapping);

					AroEntity aroEntity = EntityFactory.FACTORY.createLocationEntity(null, locationId,
							locationEntity.getCensusBlockId(), locationEntity.getCompetitiveStrength(),
							parametricLocationDemand);

					factory.add(new DefaultNetworkAssignment(aroEntity, rlNetworkAssignment.getDomain()), false);
					parametricCompetitiveLocationDemandMapping.put(locationId, parametricLocationDemandMapping);
				}
			}
		}

		NetworkData proxy = new NetworkData();
		proxy.setRoadLocations(factory.build());

		proxy.setFiberSources(networkData.getFiberSources());
		proxy.setRoadEdges(networkData.getRoadEdges());

		proxy.setCompetitiveDemandMapping(new CompetitiveDemandMapping(parametricCompetitiveLocationDemandMapping));
		
		proxy.setCableConduitEdges(networkData.getCableConduitEdges());

		return proxy;
	}
}

class NpvPlanningStrategy {
	private class ApplyBudgetConstraint extends SearchPlan {
		private final Logger log = LoggerFactory.getLogger(ApplyBudgetConstraint.class);
		private double threshold = 0.01;
		private double lowP;
		private double lowCost;
		private double highP;
		private double highCost;
		private double interpolatedP;

		public ApplyBudgetConstraint(double lowP, double lowCost, double highP, double highCost) {
			double y1 = lowCost - capex;
			double y2 = highCost - capex;
			double x1 = lowP;
			double x2 = highP;
			
			double x = x1 - y1 * (x2 - x1) / (y2 - y1);
			
			this.lowP = lowP;
			this.lowCost = lowCost;
			this.highP = highP;
			this.highCost = highCost;
			
			this.interpolatedP = x;
			log.debug("Searching lowP = {}, highP = {}", lowP, highP);
		}

		@Override
		boolean isConverging() {
			if (parametric != interpolatedP) {
				parametric = interpolatedP;
				return true;
			}

			if (totalCost >= capex) {
				log.debug("Budget exceeded : {} > {}", totalCost, capex);
				if ((totalCost - lowCost) > threshold * capex) {
					searchPlan = new ApplyBudgetConstraint(lowP, lowCost, parametric, totalCost);
					return searchPlan.isConverging();
				}

				// Converged on a minimum total cost which exceeds the budget
				searchPlan = new SelectPlan(Double.isFinite(highestNpv) ? highestNpvParametric : lowP);
				return searchPlan.isConverging();
			} else {
				if ((totalCost - lowCost) > threshold * capex) {
					searchPlan = new ApplyBudgetConstraint(parametric, totalCost, highP, highCost);
					return searchPlan.isConverging();
				}
			}

			searchPlan = new ScanForMaxNpv(0, lowP);
			return searchPlan.isConverging();
		}
	}

	private class CheckBoundaryConditions extends SearchPlan {
		private final Logger log = LoggerFactory.getLogger(CheckBoundaryConditions.class);
		private double cost1;

		@Override
		boolean isConverging() {
			if (parametric == 1) {
				if (highestNpv > Double.NEGATIVE_INFINITY) {
					log.debug("Solved: All under budget");

					searchPlan = new SelectPlan(highestNpvParametric);
					return searchPlan.isConverging();
				}

				cost1 = totalCost;
				parametric = 0;
				return true;
			}

			if (highestNpv == Double.NEGATIVE_INFINITY) {
				log.debug("Solved: All over budget");
				searchPlan = new SelectPlan(lowestOverBudgetParametric);
				return searchPlan.isConverging();
			}

			searchPlan = new ApplyBudgetConstraint(0, totalCost, 1, cost1);
			return searchPlan.isConverging();
		}
	}

	private class ScanForMaxNpv extends SearchPlan {
		private int current = 1;
		private double high;
		private double increment;
		private final Logger log = LoggerFactory.getLogger(ScanForMaxNpv.class);
		private int numProbes = 6;

		public ScanForMaxNpv(double low, double high) {
			this.high = high;
			increment = (high - low) / (numProbes + 1);
			log.debug("{} probes from {} to {}", numProbes, low, high);
		}

		@Override
		boolean isConverging() {
			double probing = high - current * increment;

			if (parametric != probing) {
				parametric = probing;
				return true;
			}

			if (current < numProbes) {
				parametric = high - ++current * increment;
				return true;
			}

			searchPlan = new SelectPlan(highestNpvParametric);
			return searchPlan.isConverging();
		}
	}

	private abstract class SearchPlan {
		abstract boolean isConverging();
	}

	private class SelectPlan extends SearchPlan {
		private final Logger log = LoggerFactory.getLogger(SelectPlan.class);
		private double selectedParametric;

		public SelectPlan(double selectedParametric) {
			this.selectedParametric = selectedParametric;
			log.debug("Selected p = {}", selectedParametric);
		}

		@Override
		boolean isConverging() {
			if (parametric != selectedParametric) {
				parametric = selectedParametric;
				return true;
			}

			return false;
		}
	}

	private double capex;
	private FinancialInputs financialInputs;
	private double highestNpv = Double.NEGATIVE_INFINITY;
	private double highestNpvParametric = 0;
	private final Logger log = LoggerFactory.getLogger(NpvPlanningStrategy.class);
	private double lowestOverBudget = Double.POSITIVE_INFINITY;

	private double lowestOverBudgetParametric = 0;

	private double npv;

	private double parametric = 1;

	private SearchPlan searchPlan = new CheckBoundaryConditions();

	private double totalCost;

	public NpvPlanningStrategy(ThresholdBudgetConstraint thresholdBudgetConstraint) {
		financialInputs = new FinancialInputs(thresholdBudgetConstraint.getDiscountRate(),
				thresholdBudgetConstraint.getYears());
		capex = thresholdBudgetConstraint.getCapex();
	}

	public boolean isConverging(OptimizedPlan optimizedPlan, PricingModel pricingModel) {

		if (optimizedPlan == null) {
			npv = Double.NEGATIVE_INFINITY;
			totalCost = Double.POSITIVE_INFINITY;

			log.debug("{}, {}, {}, Failed Plan", capex, parametric, totalCost);
		} else {
			SimpleNetworkFinancials f = new PricingModelNetworkFinancials(
					optimizedPlan.getGeneratedPlan().getWirecenterNetworkPlan(), pricingModel, financialInputs);

			npv = f.getNpv();
			totalCost = f.getTotalCost();

			log.debug("{}, {}, {}, {}, {}, {}, {}, {}, {}", capex, parametric, totalCost, f.getRevenue(),
					f.getFiberCost(), f.getEquipmentCost(), f.getFiberLength(), f.getLocationDemand().getRawCoverage(),
					npv);
		}

		if (totalCost < capex) {
			if (npv > highestNpv) {
				highestNpv = npv;
				highestNpvParametric = parametric;
				log.debug("highestNpv = {}, highestNpvParametric = {}", highestNpv, highestNpvParametric);
			}
		} else {
			if (totalCost < lowestOverBudget) {
				lowestOverBudget = totalCost;
				lowestOverBudgetParametric = parametric;
				log.debug("lowestOverBudget = {}, lowestOverBudgetParametric = {}", lowestOverBudget,
						lowestOverBudgetParametric);
			}
		}

		return searchPlan.isConverging();
	}

	public double nextParametric() {
		return parametric;
	}
}

class PricingModelNetworkFinancials extends SimpleNetworkFinancials {
	private static final MaterialType[] nodeTypeId2MaterialType = new MaterialType[10];
	static {
		nodeTypeId2MaterialType[NetworkNodeType.central_office.getId()] = MaterialType.CO;
		nodeTypeId2MaterialType[NetworkNodeType.fiber_distribution_hub.getId()] = MaterialType.FDH;
		nodeTypeId2MaterialType[NetworkNodeType.fiber_distribution_terminal.getId()] = MaterialType.FDT;
		nodeTypeId2MaterialType[NetworkNodeType.bulk_distrubution_terminal.getId()] = MaterialType.BFT;
	}

	private PricingModel pricingModel;
	private WirecenterNetworkPlan wirecenterNetworkPlan;

	PricingModelNetworkFinancials(WirecenterNetworkPlan wirecenterNetworkPlan, PricingModel pricingModel,
			FinancialInputs fi) {
		super(wirecenterNetworkPlan.getDemandCoverage().getLocationDemand(), Double.NaN, fi);
		this.wirecenterNetworkPlan = wirecenterNetworkPlan;
		this.pricingModel = pricingModel;
	}

	protected void recalcCosts() {
		fiberCost = 
		wirecenterNetworkPlan.getFiberCableConstructionTypes().stream().mapToDouble((fcct) -> wirecenterNetworkPlan.getFiberLengthInMeters(fcct) * pricingModel.getFiberCostPerMeter(fcct.getFiberType(), fcct.getCableConstructionEnum(), 1)).sum();

		equipmentCost = 0;
		wirecenterNetworkPlan.getNetworkNodes().forEach(nn -> {
			MaterialType mt = nodeTypeId2MaterialType[nn.getNetworkNodeType().getId()];
			if (mt != null) {
				equipmentCost += pricingModel.getMaterialCost(mt, nn.getAtomicUnit());
			}
		});

		totalCost = equipmentCost + fiberCost;
	}
}
