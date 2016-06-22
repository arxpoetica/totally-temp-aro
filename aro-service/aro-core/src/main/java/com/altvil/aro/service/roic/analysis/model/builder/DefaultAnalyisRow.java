package com.altvil.aro.service.roic.analysis.model.builder;

import java.util.Collection;
import java.util.Iterator;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.utils.StreamUtil;

public class DefaultAnalyisRow implements AnalysisRow {

	public static AnalysisRow sumRows(AnalysisRow... rows) {
		return sum(StreamUtil.asList(rows));
	}

	public static AnalysisRow sum(Collection<AnalysisRow> rows) {

		int size = verifySize(rows);

		double[] values = new double[size];
		for (int i = 0; i < size; i++) {
			double total = 0;
			for (AnalysisRow r : rows) {
				total += r.getValue(i);
			}
			values[i] = total;
		}
		return new DefaultAnalyisRow(values);
	}
	
	

	@Override
	public double[] getRawData() {
		return values;
	}

	public static AnalysisRow minus(AnalysisRow a, AnalysisRow b) {

		if (b == null) {
			return a;
		}

		double[] values = new double[a.getSize()];
		for (int i = 0; i < values.length; i++) {
			values[i] = a.getValue(i) - b.getValue(i);
		}
		return new DefaultAnalyisRow(values);
	}

	private static int verifySize(Collection<AnalysisRow> rows) {
		if (rows.size() == 0) {
			return 0;
		}

		Iterator<AnalysisRow> itr = rows.iterator();
		int size = itr.next().getSize();

		while (itr.hasNext()) {
			if (size != itr.next().getSize()) {
				throw new RuntimeException("Array Sizes do not match");
			}
		}

		return size;
	}

	private double[] values;

	public DefaultAnalyisRow(double[] values) {
		this.values = values;
	}

	@Override
	public int getSize() {
		return values.length;
	}

	@Override
	public double getValue(int period) {
		return values[period];
	}

}
