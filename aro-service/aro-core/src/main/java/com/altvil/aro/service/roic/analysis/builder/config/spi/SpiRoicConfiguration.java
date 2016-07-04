package com.altvil.aro.service.roic.analysis.builder.config.spi;

import com.altvil.aro.service.roic.analysis.builder.component.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;

public interface SpiRoicConfiguration {
	
	SpiComponentRoicRegistry<ComponentInput> getComponentRegistry() ;
	SpiComponentRoicRegistry<Void> getAggregateRegistry() ;
	SpiComponentRoicRegistry<RoicInputs> getNetworkRegistry() ;
	

}
