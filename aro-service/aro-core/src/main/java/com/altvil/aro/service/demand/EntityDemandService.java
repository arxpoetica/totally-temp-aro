package com.altvil.aro.service.demand;

import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;

public interface EntityDemandService {
	
	DemandAnalyizer createDemandAnalyizer(FtthThreshholds constraints) ;
	
	
}
