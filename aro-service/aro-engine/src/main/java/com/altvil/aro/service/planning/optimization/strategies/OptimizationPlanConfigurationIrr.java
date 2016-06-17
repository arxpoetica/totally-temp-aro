package com.altvil.aro.service.planning.optimization.strategies;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
import com.altvil.aro.service.planning.IrrOptimizationPlan;
import com.altvil.aro.service.planning.OptimizationPlan;

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
	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder() {
		return (p, g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode, AroEdge<GeoSegment>>(g, s);
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
		double rate1 = 0;			
		double npv1 = npv(capex, annualRevenue, rate1);
		double rate2 = 0.1;
		double npv2 = npv(capex, annualRevenue, rate2);
		
		do {
			double deltaRate = rate2 - rate1;
			double deltaNpv = npv2 - npv1;

			double nextRate = rate1 - (npv1 * deltaRate / deltaNpv);
			double nextNpv = npv(capex, annualRevenue, nextRate);
			
			final double err1 = Math.abs(nextRate - rate1);
			final double err2 = Math.abs(nextRate - rate2);
			if (err1 < err2) {
				if (err2 < 0.01) {
					return nextRate;
				}
				rate2 = nextRate;
				npv2 = nextNpv;
			} else {
				if (err1 < 0.01) {
					return nextRate;
				}
				rate1 = nextRate;
				npv1 = nextNpv;
			}
		} while (true);
	}
	
	protected double npv(double capex, double revenue, double discountRate) {
		double npv = 0;

		for (int t = 1; t <= years; t++) {
			npv += 1 / Math.pow(1 + discountRate, t);
		}
		
		return revenue * npv - capex;
	}
}

