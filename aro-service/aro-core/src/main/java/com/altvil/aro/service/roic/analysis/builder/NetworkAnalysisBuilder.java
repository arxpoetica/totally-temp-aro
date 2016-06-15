package com.altvil.aro.service.roic.analysis.builder;

import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;

public interface NetworkAnalysisBuilder {
	
	ComponentBuilder entityAnalysisBuilder(ComponentType ct) ;
	AnalysisBuilder resolve() ; 

}
