package com.altvil.aro.service.cu.execute;

public interface PreCacheAgent {

	void startPreCaching(AroExecutorService executorService) ;
	void stopPreCaching(AroExecutorService executorService) ;

	
}
