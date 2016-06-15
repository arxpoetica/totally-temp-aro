package com.altvil.aro.service.roic.analysis.builder;

import com.altvil.aro.service.roic.analysis.entity.RoicComponent.ComponentType;

public interface NetworkAnalysisBuilder {
	
	ComponentBuilder entityAnalysisBuilder(ComponentType ct) ;
	AnalysisBuilder resolve() ; 

}
