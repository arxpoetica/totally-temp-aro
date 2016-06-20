package com.altvil.aro.service.roic.analysis.registry.impl;

import java.util.Collection;
import java.util.Collections;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.registry.CurvePath;
import com.altvil.aro.service.roic.analysis.registry.CurveRegistry;

public class AbstractCurveRegistry implements CurveRegistry {

	private String nameSpace;

	public AbstractCurveRegistry(String nameSpace) {
		super();
		this.nameSpace = nameSpace;
	}

	@Override
	public String getNameSpace() {
		return nameSpace;
	}

	@Override
	public Collection<CurveRegistry> getCurveRegestries() {
		return Collections.emptyList();
	}

	@Override
	public AnalysisRow getAnalysisRow(CurvePath path) {
		throw new RuntimeException("Operation not supported");
	}

	@Override
	public CurveRegistry getCurveRegistry(CurvePath path) {
		throw new RuntimeException("Operation not supported");
	}

	@Override
	public Collection<CurveIdentifier> getCurveIdentifiers() {
		return Collections.emptyList();
	}

}