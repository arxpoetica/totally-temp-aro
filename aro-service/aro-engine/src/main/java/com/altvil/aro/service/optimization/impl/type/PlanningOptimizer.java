package com.altvil.aro.service.optimization.impl.type;

import java.util.Collection;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.altvil.aro.service.optimization.spi.ComputeUnitCallable;
import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimization;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.optimization.wirecenter.impl.DefaultOptimizationResult;
import com.altvil.enumerations.OptimizationType;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class PlanningOptimizer extends MasterOptimizer {
	private final Logger log = LoggerFactory
			.getLogger(PlanningOptimizer.class.getName());
	
	@Autowired
	protected WirecenterOptimizationService wirecenterOptimizationService;
	
	protected ComputeUnitCallable<WirecenterOptimization<Optional<PlannedNetwork>>> asCommand(
			WirecenterOptimizationRequest request) {
		return () -> {
			try {
				return new DefaultOptimizationResult<>(request,
						wirecenterOptimizationService.planNetwork(request));
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
				return new DefaultOptimizationResult<>(request,
						new OptimizationException(err.getMessage()));
			}
		};

	}

	@Override
	public boolean isOptimizerFor(OptimizationType type) {
		switch (type) {
		case UNCONSTRAINED:
		case CAPEX:
			return true;
		default:
			return false;
		}
	}

	@Override
	protected Collection<PlannedNetwork> planNetworks(MasterOptimizationRequest request,
			Collection<WirecenterOptimizationRequest> wirecenters) {

		return evaluateWirecenterCommands(
				toCommands(wirecenters, this::asCommand),
				Optional::isPresent).stream().map(Optional::get)
				.collect(Collectors.toList());

	}
}

