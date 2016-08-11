package com.altvil.aro.service.optimize;

import com.altvil.aro.service.graph.builder.CoreGraphNetworkModelService.GraphBuilderContext;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.price.PricingModel;

public class OptimizerContext {

	private PricingModel pricingModel;
	private FtthThreshholds ftpThreshholds;
	private GraphBuilderContext graphBuilderContext;

	public OptimizerContext(PricingModel pricingModel,
			FtthThreshholds ftpThreshholds,
			GraphBuilderContext graphBuilderContext) {
		super();
		this.pricingModel = pricingModel;
		this.ftpThreshholds = ftpThreshholds;
		this.graphBuilderContext = graphBuilderContext;
	}

	public boolean isFullAnalysisModel() {
		return true;
	}

	public PricingModel getPricingModel() {
		return pricingModel;
	}

	public FtthThreshholds getFtthThreshholds() {
		return ftpThreshholds;
	}

	public GraphBuilderContext getGraphBuilderContext() {
		return graphBuilderContext;
	}

}
