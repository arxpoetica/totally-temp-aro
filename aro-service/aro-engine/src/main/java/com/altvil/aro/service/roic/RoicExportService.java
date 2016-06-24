package com.altvil.aro.service.roic;

import java.io.IOException;
import java.io.Reader;
import java.util.Collection;

import com.altvil.aro.service.roic.analysis.RowReference;

public interface RoicExportService {

	Reader createCsvReader(Collection<RowReference> rows) throws IOException;

}
