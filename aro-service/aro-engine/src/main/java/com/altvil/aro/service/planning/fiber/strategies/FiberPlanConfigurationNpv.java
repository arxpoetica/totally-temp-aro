package com.altvil.aro.service.planning.fiber.strategies;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.NpvClosestFirstIterator;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;
import com.altvil.aro.service.planning.NpvFiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;

public class FiberPlanConfigurationNpv extends AbstractFiberPlanConfigurationNpv<NpvFiberPlan> implements FiberPlanConfiguration<NpvFiberPlan> {
		public FiberPlanConfigurationNpv(NpvFiberPlan fiberPlan) {
			super(fiberPlan);
		}

		@Deprecated
		double getDiscountRate() {
			return fiberPlan.getDiscountRate();
		}

		@Deprecated
		int getYears() {
			return fiberPlan.getYears();
		}
		

	}