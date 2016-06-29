package com.altvil.aro.service.optimization.spi;

import java.util.Collection;
import java.util.List;
import java.util.concurrent.Future;

public interface OptimizationExecutor {

	<V> Future<V> submit(ComputeUnitCallable<V> callable);

	<V> List<Future<V>> invokeAll(
			Collection<ComputeUnitCallable<V>> callables);

}
