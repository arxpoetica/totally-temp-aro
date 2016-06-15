package com.altvil.aro.service.roic.analysis.builder.impl;

import java.util.Collection;

import com.altvil.aro.service.roic.RoicInputs;
import com.altvil.aro.service.roic.analysis.builder.AnalysisBuilder;
import com.altvil.aro.service.roic.analysis.builder.NetworkAnalysisBuilder;
import com.altvil.aro.service.roic.model.NetworkType;

public class RoicAnalysisBuilder implements AnalysisBuilder {

	private int startYear ;
	private int startPeriod ;
	
	@Override
	public AnalysisBuilder setAnalysisPeriod(int periodInYears) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public AnalysisBuilder setStartYear(int year) {
		// TODO Auto-generated method stub
		return null;
	}
	
	

	@Override
	public AnalysisBuilder setCopper(Collection<RoicInputs> inputs) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public AnalysisBuilder setFibber(Collection<RoicInputs> inputs) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public NetworkAnalysisBuilder networkAnalysisBuilder(NetworkType type) {
		// TODO Auto-generated method stub
		return null;
	}

}
