package com.altvil.aro.service.roic;

import java.io.Reader;
import java.util.Collection;

import com.altvil.aro.service.roic.analysis.model.RoicModel;

public interface RoicExportService {
	
	Reader createCsvReader(RoicModel model, Collection<String> curves) ;
	Reader createCsvReader(RoicModel model) ;

}
