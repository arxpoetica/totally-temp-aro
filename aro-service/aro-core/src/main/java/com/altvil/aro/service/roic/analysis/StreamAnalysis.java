package com.altvil.aro.service.roic.analysis;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;

public interface StreamAnalysis {
	RowReference getAnalysisRow(CurveIdentifier name) ;
	Collection<RowReference> getAnalysisRows() ;
}
