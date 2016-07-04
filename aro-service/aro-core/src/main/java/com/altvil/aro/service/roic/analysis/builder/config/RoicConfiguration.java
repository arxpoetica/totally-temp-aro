package com.altvil.aro.service.roic.analysis.builder.config;

import com.altvil.aro.service.roic.analysis.builder.component.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;

public interface RoicConfiguration {
	
	NetworkAnalysisType getNetworkAnalysisType() ;
	ComponentConfig<ComponentInput> getComponentConfig(ComponentType ct) ;
	ComponentConfig<Void> getAggregateConfig(ComponentType componentType) ;
	ComponentConfig<RoicInputs> getNetworkConfig() ;
	

}
