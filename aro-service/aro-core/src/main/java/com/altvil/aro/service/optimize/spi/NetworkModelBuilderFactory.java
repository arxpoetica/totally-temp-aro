package com.altvil.aro.service.optimize.spi;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.optimize.FTTHOptimizerService.OptimizerContextBuilder;

public interface NetworkModelBuilderFactory {

	public NetworkModelBuilder create(NetworkData networkData,
			OptimizerContextBuilder constraintBuilder);

}
