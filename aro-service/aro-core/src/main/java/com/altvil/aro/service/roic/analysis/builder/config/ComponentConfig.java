package com.altvil.aro.service.roic.analysis.builder.config;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public interface ComponentConfig<T> {

	ComponentType getComponentType();
	Collection<CurveIdentifier> getExportedCurves();
	Collection<CurveConfig<T>> getCurveConfigurations() ;
	Collection<CurveIdentifier> getGroupByCurves(Collection<CurveIdentifier> existingCurves) ;
	
	
}
