package com.altvil.aro.service.roic.analysis.impl;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.AnalysisRow;

public class DefaultAnalyisRow implements AnalysisRow {

	public static AnalysisRow sum(int size, Collection<AnalysisRow> rows) {
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

	public static AnalysisRow minus(AnalysisRow a, AnalysisRow b) {
		
		if( b == null ) {
			return a ;
		}
		
		double[] values = new double[a.getSize()];
		for (int i = 0; i < values.length; i++) {
			values[i] = a.getValue(i) - b.getValue(i);
		}
		return new DefaultAnalyisRow(values);
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
