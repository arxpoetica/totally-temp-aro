package com.altvil.aro.service.optimize.spi;

import com.altvil.aro.service.optimize.OptimizerContext;

public interface NetworkAnalysisFactory {

	public abstract NetworkAnalysis createNetworkAnalysis(
			NetworkModelBuilder networkModelBuilder, OptimizerContext ctx);

}