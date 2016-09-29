package com.altvil.utils.csv;

import java.io.Reader;
import java.util.List;

import com.opencsv.bean.ColumnPositionMappingStrategy;
import com.opencsv.bean.CsvToBean;

public class CsvReaderWriterFactory {
	
	public static final CsvReaderWriterFactory FACTORY = new CsvReaderWriterFactory() ;

	private <T> ColumnPositionMappingStrategy<T> createMapping(Class<T> clz,
			String[] columns) {
		ColumnPositionMappingStrategy<T> strat = new ColumnPositionMappingStrategy<>();
		strat.setType(clz);
		// the fields to bind do in your JavaBean
		if (columns != null) {
			strat.setColumnMapping(columns);
		}
		return strat;
	}

	public <T> CsvReaderWriter<T> create(Class<T> clz, String... columns) {
		return new CsvReaderWriter<T>(createMapping(clz, columns));
	}

	public <T> CsvReaderWriter<T> create(Class<T> clz) {
		return new CsvReaderWriter<T>(createMapping(clz, null));
	}

	public <T> List<T> parse(Class<T> clz, String[] columns, Reader reader) {
		return new CsvToBean<T>().parse(createMapping(clz, columns), reader);
	}

}
