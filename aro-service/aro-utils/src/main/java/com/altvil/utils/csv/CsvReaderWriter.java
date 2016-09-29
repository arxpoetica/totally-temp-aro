package com.altvil.utils.csv;

import java.io.Reader;
import java.io.Writer;
import java.util.List;

import com.opencsv.bean.BeanToCsv;
import com.opencsv.bean.ColumnPositionMappingStrategy;
import com.opencsv.bean.CsvToBean;

public class CsvReaderWriter<T> {

	private ColumnPositionMappingStrategy<T> mapping;

	public CsvReaderWriter(ColumnPositionMappingStrategy<T> mapping) {
		super();
		this.mapping = mapping;
	}

	public List<T> parse(Reader reader) {
		return new CsvToBean<T>().parse(mapping, reader);
	}

	public void write(Writer writer, List<T> values) {
		new BeanToCsv<T>().write(mapping, writer, values);
	}

}
