package com.altvil.aro.service.roic.analysis;

public class AnalysisPeriod {

	private int startYear;
	private int periods;

	public AnalysisPeriod(int startYear, int periods) {
		super();
		this.startYear = startYear;
		this.periods = periods;
		
	}

	public int getStartYear() {
		return startYear;
	}

	public int getPeriods() {
		return periods;
	}

}
