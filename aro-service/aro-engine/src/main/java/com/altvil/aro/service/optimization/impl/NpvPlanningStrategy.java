package com.altvil.aro.service.optimization.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.service.entity.FinancialInputs;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.entity.SimpleNetworkFinancials;
import com.altvil.aro.service.graph.alg.NpvClosestFirstIterator;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.price.PricingModel;

public class NpvPlanningStrategy {
	private double		 highestNpv					= Double.NEGATIVE_INFINITY;
	private double		 highestNpvParametric		= 0;
	private double		 lowestOverBudget			= Double.POSITIVE_INFINITY;
	private double		 lowestOverBudgetParametric	= 0;
	private final Logger log						= LoggerFactory.getLogger(NpvPlanningStrategy.class);
	private double		 parametric					= 1;
	private double		 npv;
	private double		 totalCost;
	private SearchPlan	 searchPlan					= new CheckBoundaryConditions();
	private FinancialInputs financialInputs;
	private double capex;

	
	public NpvPlanningStrategy(ThresholdBudgetConstraint thresholdBudgetConstraint) {
		financialInputs = new FinancialInputs(thresholdBudgetConstraint.getDiscountRate(), thresholdBudgetConstraint.getYears());
		capex = thresholdBudgetConstraint.getCapex();
	}	

	public boolean isConverging(WirecenterNetworkPlan wirecenterNetworkPlan, PricingModel pricingModel) {
		SimpleNetworkFinancials f = new PricingModelNetworkFinancials(wirecenterNetworkPlan, pricingModel, financialInputs);
		
		npv = f.getNpv();
		totalCost = f.getTotalCost();

		log.debug("{}, {}, {}, {}, {}, {}, {}, {}, {}", capex, parametric, totalCost, f.getRevenue(),
				f.getFiberCost(), f.getEquipmentCost(), f.getFiberLength(), f.getLocationDemand().getRawCoverage(),
				npv);

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

	public ClosestFirstSurfaceBuilder getClosestFirstSurfaceIteratorBuilder() {
		return new NpvClosestFirstIterator.Builder(financialInputs.getDiscountRate(), financialInputs.getYears());
	}

	private abstract class SearchPlan {
		abstract boolean isConverging();
	}

	private class CheckBoundaryConditions extends SearchPlan {
		private final Logger log						= LoggerFactory.getLogger(CheckBoundaryConditions.class);
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

	private class ApplyBudgetConstraint extends SearchPlan {
		private final Logger log						= LoggerFactory.getLogger(ApplyBudgetConstraint.class);
		private double low;
		private double high;
		private int	   numProbes = 3;
		private int	   current	 = 1;
		private double increment;

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

	private class ScanForMaxNpv extends SearchPlan {
		private final Logger log						= LoggerFactory.getLogger(ScanForMaxNpv.class);
		private double high;
		private int	   numProbes = 12;
		private int	   current	 = 1;
		private double increment;

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

	private class SelectPlan extends SearchPlan {
		private final Logger log						= LoggerFactory.getLogger(SelectPlan.class);
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
}

class PricingModelNetworkFinancials extends SimpleNetworkFinancials {
	private WirecenterNetworkPlan wirecenterNetworkPlan;
	private PricingModel		  pricingModel;

	private static final MaterialType[] nodeTypeId2MaterialType = new MaterialType[10];
	static {
		nodeTypeId2MaterialType[NetworkNodeType.central_office.getId()] = MaterialType.CO;
		nodeTypeId2MaterialType[NetworkNodeType.fiber_distribution_hub.getId()] = MaterialType.FDH;
		nodeTypeId2MaterialType[NetworkNodeType.fiber_distribution_terminal.getId()] = MaterialType.FDT;
		nodeTypeId2MaterialType[NetworkNodeType.bulk_distrubution_terminal.getId()] = MaterialType.BFT;
	}

	PricingModelNetworkFinancials(WirecenterNetworkPlan wirecenterNetworkPlan, PricingModel pricingModel, FinancialInputs fi) {
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