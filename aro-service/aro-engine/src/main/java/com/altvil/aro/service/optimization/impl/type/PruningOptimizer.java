package com.altvil.aro.service.optimization.impl.type;

import java.util.Collection;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.aro.service.optimization.spi.ComputeUnitCallable;
import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.strategy.OptimizationEvaluatorFactory;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimization;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.optimization.wirecenter.impl.DefaultOptimizationResult;
import com.altvil.enumerations.OptimizationType;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class PruningOptimizer extends MasterOptimizer {
	private final Logger log = LoggerFactory
			.getLogger(PruningOptimizer.class.getName());
	@Autowired
	private OptimizationEvaluatorFactory strategyService;
	@Autowired
	private WirecenterOptimizationService wirecenterOptimizationService;

	private ComputeUnitCallable<WirecenterOptimization<PrunedNetwork>> asCommand(
			WirecenterOptimizationRequest request) {
		return () -> {
			try {
				return new DefaultOptimizationResult<>(request,
						wirecenterOptimizationService.pruneNetwork(request));
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
				return new DefaultOptimizationResult<>(request,
						new OptimizationException(err.getMessage()));
			}
		};

	}

	@Override
	public boolean isOptimizerFor(OptimizationType type) {
		return true;
	}

	@Override
	protected Collection<PlannedNetwork> planNetworks(MasterOptimizationRequest request,
			Collection<WirecenterOptimizationRequest> wirecenters) {

		Collection<PrunedNetwork> prunedNetworks = evaluateWirecenterCommands(
				toCommands(wirecenters, this::asCommand), n -> !n.isEmpty());

		return strategyService.getOptimizationEvaluator((ThresholdBudgetConstraint)request.getOptimizationConstraints(), request.getOptimizationMode()).evaluateNetworks(prunedNetworks);

	}

}
