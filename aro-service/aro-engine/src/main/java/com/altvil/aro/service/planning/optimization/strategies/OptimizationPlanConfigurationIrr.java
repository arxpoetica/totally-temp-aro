package com.altvil.aro.service.planning.optimization.strategies;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.AnalysisNode;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.planning.IrrOptimizationPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.enumerations.OptimizationType;

public class OptimizationPlanConfigurationIrr extends OptimizationPlanConfiguration implements OptimizationPlan {
	private static final long serialVersionUID = 1L;
	private final int years;
	private final Logger log = LoggerFactory.getLogger(OptimizationPlanConfigurationIrr.class);

	@Override
	public
	double score(GeneratingNode node) {
		final double monthlyRevenueImpact = node.getFiberCoverage().getMonthlyRevenueImpact();
		if (monthlyRevenueImpact == 0) {
			return 0;
		}
		
		return node.getCapex() / monthlyRevenueImpact; 
	}

	public OptimizationPlanConfigurationIrr(IrrOptimizationPlan fiberPlan) {
		super(fiberPlan);
		this.years = fiberPlan.getYears();
	}
	
	public int getYears() {
		return years;
	}

	public boolean isFilteringRoadLocationDemandsBySelection() {
		return false;
	}

	public boolean isFilteringRoadLocationsBySelection() {
		return true;
	}

	public Function<AroEdge<GeoSegment>, Set<GraphNode>> getSelectedEdges(NetworkData networkData) {
		return (e) ->
		{
			GeoSegment value = e.getValue();
			
			if (value == null) {
				return Collections.emptySet();
			}
			
			Collection<GraphEdgeAssignment> geoSegmentAssignments = value.getGeoSegmentAssignments();

			if (geoSegmentAssignments.isEmpty()) {
				return Collections.emptySet();
			}

			// There may be multiple marked locations on this edge so it may be
			// necessary to return both vertices of this edge.
			Set<GraphNode> selectedNodes = new HashSet<>();
			for (GraphEdgeAssignment assignment : geoSegmentAssignments) {
				if (assignment.getPinnedLocation().isAtStartVertex()) {
					selectedNodes.add(e.getSourceNode());
				} else {
					selectedNodes.add(e.getTargetNode());
				}
			}

			return selectedNodes;
		};
	}
	
	@Override
	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder(
			GlobalConstraint globalConstraint) {
		return (g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode, AroEdge<GeoSegment>>(g, s);
	}
	

	/**
	 * ???????
	 */
	@Override
	public boolean isConstraintMet(NetworkAnalysis analysis) {
				return false;
	}

	@Override
	public Optional<OptimizedNetwork> selectOptimization(Collection<OptimizedNetwork> optimizedPlans) {
		double maxIrr = Double.NEGATIVE_INFINITY;
		OptimizedNetwork maxIrrPlan = null;

		for (OptimizedNetwork optimizedPlan : optimizedPlans) {
			AnalysisNode analysisNode = optimizedPlan.getAnalysisNode();
			double capex = analysisNode.getCapex();
			
			double annualRevenue = 12 * analysisNode.getFiberCoverage().getMonthlyRevenueImpact();

			double irr = calculateIrr(capex, annualRevenue);
			
			if (rejectPlan(capex, annualRevenue, irr)) {
				continue;
			}
			
			log.debug("Capex = {}, Annual Revenue = {}, IRR = {}", capex, annualRevenue, irr);

			if (irr > maxIrr) {
				maxIrr = irr;
				maxIrrPlan = optimizedPlan;
				
				if (chooseIrr(irr)) {
					break;
				}
			}
		}
		
		log.debug("Selected plan w/IRR = {}", maxIrr);

		return maxIrrPlan == null ? Optional.empty() : Optional.of(maxIrrPlan);
	}
	
	protected boolean chooseIrr(double irr) {
		return false;
	}

	protected boolean rejectPlan(double capex, double annualRevenue, double irr) {
		return false;
	}
	
	protected double calculateIrr(double capex, double annualRevenue) {
		double[] rates = {-.1, .1};
		double[] npv = {npv(capex, annualRevenue, rates[0]), npv(capex, annualRevenue, rates[1])};
		int oldest = 0;
		int kjg = 50;
		
		do {
			double deltaRate = rates[0] - rates[1];
			double deltaNpv = npv[0] - npv[1];

			double nextRate = rates[1] - (npv[1] * deltaRate / deltaNpv);
			double nextNpv = npv(capex, annualRevenue, nextRate);
			
			if (Math.abs(rates[0] - rates[1]) < 0.001 || Double.isNaN(rates[0])) {
				break;
			}
			
			rates[oldest] = nextRate;
			npv[oldest] = nextNpv;
			oldest = 1 - oldest;
			if (kjg-- < 0) {
				kjg = 50;
				break;
			}
		} while (true);
		
		return rates[0];		
	}
	
	protected double npv(double capex, double revenue, double discountRate) {
		double npv = -capex;

		for (int t = 1; t < years; t++) {
			npv += revenue / Math.pow(1 + discountRate, t);
		}
		
		return npv;
	}
}

