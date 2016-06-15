package com.altvil.aro.service.roic.analysis.entity;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.RowReference;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;

public interface RoicComponent {
	
	public enum ComponentType {
		undefined,
		household,
		business,
		cellTower,
		
	}

	ComponentType getComponentType() ;
	RowReference getNetworkAnalysis(CurveIdentifier id);
	public Collection<RowReference> getCurves() ;

}
