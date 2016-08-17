package com.altvil.aro.service.optimize;

import com.altvil.aro.service.entity.FinancialInputs;
import com.altvil.aro.service.graph.builder.CoreGraphNetworkModelService.GraphBuilderContext;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.price.PricingModel;

public class OptimizerContext {

	private PricingModel pricingModel;
	private FtthThreshholds ftpThreshholds;
	private GraphBuilderContext graphBuilderContext;
	private FinancialInputs financialInputs;

	public OptimizerContext(PricingModel pricingModel,
			FtthThreshholds ftpThreshholds,
			GraphBuilderContext graphBuilderContext,
			FinancialInputs financialInputs) {
		super();
		this.pricingModel = pricingModel;
		this.ftpThreshholds = ftpThreshholds;
		this.graphBuilderContext = graphBuilderContext;
		this.financialInputs = financialInputs;
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

	public FinancialInputs getFinancialInputs() {
		return financialInputs;
	}

}
