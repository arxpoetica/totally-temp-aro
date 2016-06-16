package com.altvil.aro.service.roic;

public class AnalysisPeriod {

	private int startYear;
	private int periods;

	public AnalysisPeriod(int startYear, int periods) {
		super();
		this.startYear = startYear;
		this.periods = periods;
		
		if( periods == 14 ) {
			int x = 10 ;
		}
		
	}

	public int getStartYear() {
		return startYear;
	}

	public int getPeriods() {
		return periods;
	}

}
