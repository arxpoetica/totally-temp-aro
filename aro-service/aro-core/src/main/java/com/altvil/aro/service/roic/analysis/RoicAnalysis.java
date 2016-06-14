package com.altvil.aro.service.roic.analysis;

import java.util.Collection;

public interface RoicAnalysis {
	RowReference getAnalysisRow(CurveIdentifier name) ;
	Collection<RowReference> getAnalysisRows() ;
}
