package com.altvil.aro.service.roic.analysis.model.builder;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.RowReference;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public class DefaultRowReference implements RowReference {

	private CurveIdentifier curveIdentifier;
	private AnalysisRow row;
	
	
	public DefaultRowReference(CurveIdentifier curveIdentifier, AnalysisRow row) {
		super();
		this.curveIdentifier = curveIdentifier;
		this.row = row;
	}

	@Override
	public CurveIdentifier getIdentifier() {
		return curveIdentifier ;
	}

	@Override
	public AnalysisRow getAnalysisRow() {
		return row ;
	}

}
