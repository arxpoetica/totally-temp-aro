package com.altvil.aro.service.plan.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.graph.alg.NpvClosestFirstIterator;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.network.GraphRenoderService;
import com.altvil.aro.service.route.RoutePlaningService;
import com.altvil.enumerations.OptimizationType;

@Service
@Order(Ordered.LOWEST_PRECEDENCE)
public class NpvCoreLeastCostRoutingServiceImpl extends CoreLeastCostRoutingServiceImpl {

	@Autowired
	public NpvCoreLeastCostRoutingServiceImpl(GraphRenoderService graphRenoderService,
			GraphTransformerFactory transformFactory, RoutePlaningService routePlaningService) {
		super(graphRenoderService, transformFactory, routePlaningService);
	}

	@Override
	public boolean isRoutingServiceFor(OptimizationType type) {
		return OptimizationType.NPV == type;
	}

	protected ClosestFirstSurfaceBuilder getDijkstrIteratorBuilder() {
		return new NpvClosestFirstIterator.Builder(discountRate, years);
	}

}
