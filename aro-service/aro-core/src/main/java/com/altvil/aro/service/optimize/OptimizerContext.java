package com.altvil.aro.service.optimize;

import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;

public class OptimizerContext {

	//TODO KG Remove this
	private boolean fullAnalysisNode = true ;
	private PricingModel pricingModel;
	private FtthThreshholds ftpThreshholds ;
	
	public OptimizerContext(PricingModel pricingModel, 
							FtthThreshholds ftpThreshholds) {
		super();
		this.pricingModel = pricingModel;
		this.ftpThreshholds = ftpThreshholds ;
	}

	public boolean isFullAnalysisModel() {
		return fullAnalysisNode;
	}

	public PricingModel getPricingModel() {
		return pricingModel;
	}

	public FtthThreshholds getFtthThreshholds() {
		return ftpThreshholds;
	}
}
