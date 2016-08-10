package com.altvil.aro.service.optimization.impl.type;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.altvil.aro.model.NetworkNodeType;
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
import com.altvil.aro.service.graph.alg.NpvClosestFirstIterator;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.NetworkDataService;
import com.altvil.aro.service.network.impl.DefaultNetworkAssignment;
import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.aro.service.optimization.spi.ComputeUnitCallable;
import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimization;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.impl.DefaultOptimizationResult;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.price.PricingContext;
import com.altvil.aro.service.price.PricingModel;
import com.altvil.aro.service.price.PricingService;
import com.altvil.enumerations.OptimizationType;
import com.altvil.interfaces.NetworkAssignment;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class NpvPlanningOptimizer extends PlanningOptimizer {
	private final Logger log = LoggerFactory.getLogger(NpvPlanningOptimizer.class.getName());

	@Autowired
	private NetworkDataService networkService;
	@Autowired
	private PricingService pricingService;

	protected ComputeUnitCallable<WirecenterOptimization<Optional<PlannedNetwork>>> asCommand(
			WirecenterOptimizationRequest request) {
		return () -> {
			try {
				final PricingModel pricingModel = pricingService.getPricingModel("*", new Date(),
						PricingContext.create(request.getConstructionRatios()));
				final NetworkData networkData = networkService.getNetworkData(request.getNetworkDataRequest());

				OptimizationConstraints optimizationConstraints = request.getOptimizationConstraints();
				NpvPlanningStrategy nps = new NpvPlanningStrategy((ThresholdBudgetConstraint) optimizationConstraints);
				Optional<PlannedNetwork> plan;
				OptimizedPlan optimizedPlan;
				do {
					NetworkData proxyData = proxyData(networkData, nps.nextParametric());
					plan = wirecenterOptimizationService.planNetwork(request, proxyData);
					if (plan.isPresent()) {
						optimizedPlan = reify(optimizationConstraints, plan.get());
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

	@Override
	public boolean isOptimizerFor(OptimizationType type) {
		switch (type) {
		case NPV:
			return true;
		default:
			return false;
		}
	}

	private NetworkData proxyData(NetworkData networkData, double nextParametric) {
		if (nextParametric == 1D) {
			return networkData;
		}

		Map<Long, CompetitiveLocationDemandMapping> parametricCompetitiveLocationDemandMapping = new HashMap<>();
		List<NetworkAssignment> roadLocations = new ArrayList<>();

		for (NetworkAssignment rlNetworkAssignment : networkData.getRoadLocations()) {
			LocationEntity locationEntity = (LocationEntity) rlNetworkAssignment.getSource();
			Long locationId = locationEntity.getObjectId();

			if (networkData.getSelectedRoadLocationIds().contains(locationId)) {
				CompetitiveLocationDemandMapping locationDemandMapping = networkData.getCompetitiveDemandMapping()
						.getLocationDemandMapping(locationId);

				roadLocations.add(rlNetworkAssignment);

				assert locationDemandMapping != null;

				parametricCompetitiveLocationDemandMapping.put(locationId, locationDemandMapping);
			} else if (nextParametric > 0) {
				CompetitiveLocationDemandMapping locationDemandMapping = networkData.getCompetitiveDemandMapping()
						.getLocationDemandMapping(locationId);
				CompetitiveLocationDemandMapping parametricLocationDemandMapping = new CompetitiveLocationDemandMapping(
						locationDemandMapping.getBlockId(), locationDemandMapping.getCompetitiveStrength());

				for (LocationEntityType value : LocationEntityType.values()) {
					EntityDemandMapping entityDemandMapping = locationDemandMapping.getEntityDemandMapping(value);

					parametricLocationDemandMapping.add(value, entityDemandMapping.getMappedDemand() * nextParametric,
							entityDemandMapping.getMappedRevenue() * nextParametric);
				}

				 // NOTE:The fair share mapping is cached so do NOT use the parametric mapping in the call to createFairShareDemandMapping.
				LocationDemand parametricLocationDemand = aroDemandService
						.createFairShareDemandMapping(locationDemandMapping)
						.getFairShareLocationDemand(SpeedCategory.cat7)
						.createLocationDemand(parametricLocationDemandMapping);

				AroEntity aroEntity = EntityFactory.FACTORY.createLocationEntity(null, locationId,
						locationEntity.getCensusBlockId(), locationEntity.getCompetitiveStrength(),
						parametricLocationDemand);

				roadLocations.add(new DefaultNetworkAssignment(aroEntity, rlNetworkAssignment.getDomain()));
				parametricCompetitiveLocationDemandMapping.put(locationId, parametricLocationDemandMapping);
			}
		}

		NetworkData proxy = new NetworkData();

		proxy.setRoadLocations(roadLocations);
		proxy.setSelectedRoadLocationIds(networkData.getSelectedRoadLocationIds());

		proxy.setFiberSources(networkData.getFiberSources());
		proxy.setRoadEdges(networkData.getRoadEdges());

		proxy.setCompetitiveDemandMapping(new CompetitiveDemandMapping(parametricCompetitiveLocationDemandMapping));

		return proxy;
	}
}

class NpvPlanningStrategy {
	private class ApplyBudgetConstraint extends SearchPlan {
		private int current = 1;
		private double high;
		private double increment;
		private final Logger log = LoggerFactory.getLogger(ApplyBudgetConstraint.class);
		private double low;
		private int numProbes = 3;

		public ApplyBudgetConstraint(double low, double high) {
			this.low = low;
			this.high = high;
			increment = (high - low) / (numProbes + 1);
			log.debug("Searching low = {}, high = {}", low, high);
		}

		@Override
		boolean isConverging() {
			double probing = low + current * increment;

			if (parametric != probing) {
				parametric = probing;
				return true;
			}

			if (totalCost > capex) {
				log.debug("Budget exceeded : {} > {}", totalCost, capex);
				if ((high - low) > 0.001) {
					searchPlan = new ApplyBudgetConstraint(probing - increment, probing);
					return searchPlan.isConverging();
				}

				searchPlan = new SelectPlan(Double.isFinite(highestNpv) ? highestNpvParametric : low);
				return searchPlan.isConverging();
			}

			if (current < numProbes) {
				parametric = low + ++current * increment;
				return true;
			}

			if ((high - low) > 0.001) {
				searchPlan = new ApplyBudgetConstraint(high - increment, high);
				return searchPlan.isConverging();
			}

			searchPlan = new ScanForMaxNpv(high - increment, high);
			return searchPlan.isConverging();
		}
	}

	private class CheckBoundaryConditions extends SearchPlan {
		private final Logger log = LoggerFactory.getLogger(CheckBoundaryConditions.class);

		@Override
		boolean isConverging() {
			if (parametric == 1) {
				if (highestNpv > Double.NEGATIVE_INFINITY) {
					log.debug("Solved: All under budget");

					searchPlan = new SelectPlan(highestNpvParametric);
					return searchPlan.isConverging();
				}

				parametric = 0;
				return true;
			}

			if (highestNpv == Double.NEGATIVE_INFINITY) {
				log.debug("Solved: All over budget");
				searchPlan = new SelectPlan(lowestOverBudgetParametric);
				return searchPlan.isConverging();
			}

			searchPlan = new ApplyBudgetConstraint(0, 1);
			return searchPlan.isConverging();
		}
	}

	private class ScanForMaxNpv extends SearchPlan {
		private int current = 1;
		private double high;
		private double increment;
		private final Logger log = LoggerFactory.getLogger(ScanForMaxNpv.class);
		private int numProbes = 12;

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

	public ClosestFirstSurfaceBuilder getClosestFirstSurfaceIteratorBuilder() {
		return new NpvClosestFirstIterator.Builder(financialInputs.getDiscountRate(), financialInputs.getYears());
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
// protected Collection<WirecenterOptimizationRequest>
// computeWireCenterRequests(
// MasterOptimizationRequest request) {
// List<Number> wireCentersPlans = networkPlanRepository
// .computeWirecenterUpdates(request.getPlanId());
//
// return StreamUtil.map(
// wireCentersPlans,
// id -> {
// return new WirecenterOptimizationRequest(request
// .getOptimizationConstraints(), request
// .getConstraints(), request
// .getNetworkDataRequest().createRequest(
// id.longValue(), request.getNetworkDataRequest().getSelectionMode()));
// });
// }
//
// protected ComputeUnitCallable<WirecenterOptimization<GeneratedPlan>>
// generatePlanCommand(
// OptimizationConstraints constraints, WirecenterOptimizationRequest
// wirecenterRequest) {
// return () -> {
// WirecenterNetworkPlan wirecenterNetworkPlan;
// PlannedNetwork plan;
// try {
// PricingModel pricingModel = pricingService.getPricingModel("*", new Date());
// NetworkData networkData = networkService.getNetworkData(wirecenterRequest
// .getNetworkDataRequest());
//
// OptimizationConstraints optimizationConstraints =
// wirecenterRequest.getOptimizationConstraints();
// NpvPlanningStrategy nps = new NpvPlanningStrategy((ThresholdBudgetConstraint)
// optimizationConstraints);
// do {
// NetworkData proxyData = proxyData(networkData, nps.nextParametric());
// plan = planNetwork(wirecenterRequest, proxyData);
// wirecenterNetworkPlan = reify(plan);
// } while (nps.isConverging(wirecenterNetworkPlan, pricingModel));
//
// final NetworkDemandSummary demandSummary = toNetworkDemandSummary(
// wirecenterNetworkPlan.getDemandCoverage(),
// plan.getCompetitiveDemandMapping());
//
// GeneratedPlan generatedPlan = new GeneratedPlanImpl(
// demandSummary, constraints, wirecenterNetworkPlan);
// return new DefaultOptimizationResult<>(wirecenterRequest, generatedPlan);
// } catch (Throwable err) {
// String message = err.getMessage();
// if (message == null) {
// message = err.getClass().getName();
// }
// log.error(message, err);
// return new DefaultOptimizationResult<>(wirecenterRequest,
// new OptimizationException(message));
// }
// };
// }
//
// private NetworkData proxyData(NetworkData networkData, double nextParametric)
// {
// if (nextParametric == 1D) {
// return networkData;
// }
//
// Map<Long, CompetitiveLocationDemandMapping>
// parametricCompetitiveLocationDemandMapping = new HashMap<>();
// List<NetworkAssignment> roadLocations = new ArrayList<>();
//
// for (NetworkAssignment rlNetworkAssignment : networkData.getRoadLocations())
// {
// LocationEntity locationEntity = (LocationEntity)
// rlNetworkAssignment.getSource();
// Long locationId = locationEntity.getObjectId();
//
// if (networkData.getSelectedRoadLocationIds().contains(locationId)) {
// CompetitiveLocationDemandMapping locationDemandMapping =
// networkData.getCompetitiveDemandMapping().getLocationDemandMapping(locationId);
//
// roadLocations.add(rlNetworkAssignment);
//
// assert locationDemandMapping != null;
//
// parametricCompetitiveLocationDemandMapping.put(locationId,
// locationDemandMapping);
// } else if (nextParametric > 0) {
// CompetitiveLocationDemandMapping locationDemandMapping =
// networkData.getCompetitiveDemandMapping().getLocationDemandMapping(locationId);
// CompetitiveLocationDemandMapping parametricLocationDemandMapping = new
// CompetitiveLocationDemandMapping(locationDemandMapping.getBlockId(),
// locationDemandMapping.getCompetitiveStrength());
//
// for (LocationEntityType value : LocationEntityType.values()) {
// EntityDemandMapping entityDemandMapping =
// locationDemandMapping.getEntityDemandMapping(value);
//
// parametricLocationDemandMapping.add(value,entityDemandMapping.getMappedDemand()
// * nextParametric, entityDemandMapping.getMappedRevenue() * nextParametric);
// }
//
// LocationDemand parametricLocationDemand = aroDemandService
// .createFairShareDemandMapping(locationDemandMapping) // NOTE: The fair share
// mapping is cached so do NOT use the parametric mapping here.
// .getFairShareLocationDemand(SpeedCategory.cat7)
// .createLocationDemand(parametricLocationDemandMapping);
//
// AroEntity aroEntity = EntityFactory.FACTORY.createLocationEntity(
// null, locationId, locationEntity.getCensusBlockId(),
// locationEntity.getCompetitiveStrength(), parametricLocationDemand);
//
// roadLocations.add(new DefaultNetworkAssignment(aroEntity,
// rlNetworkAssignment.getDomain()));
// parametricCompetitiveLocationDemandMapping.put(locationId,
// parametricLocationDemandMapping);
// }
// }
//
// NetworkData proxy = new NetworkData();
//
// proxy.setRoadLocations(roadLocations);
// proxy.setSelectedRoadLocationIds(networkData.getSelectedRoadLocationIds());
//
// proxy.setFiberSources(networkData.getFiberSources());
// proxy.setRoadEdges(networkData.getRoadEdges());
//
// proxy.setCompetitiveDemandMapping(new
// CompetitiveDemandMapping(parametricCompetitiveLocationDemandMapping));
//
// return proxy;
// }
