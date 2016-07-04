package com.altvil.aro.service.roic.analysis.calc.impl;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.calc.StreamAssembler;
import com.altvil.aro.service.roic.analysis.calc.StreamModel;
import com.altvil.aro.service.roic.analysis.model.curve.AnalysisRow;
import com.altvil.aro.service.roic.analysis.model.curve.RowReference;
import com.altvil.aro.service.roic.analysis.model.impl.DefaultRowReference;
import com.altvil.aro.service.roic.analysis.op.Op;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.registry.impl.AbstractCurveRegistry;
import com.altvil.utils.StreamUtil;

public class StreamModelImpl extends AbstractCurveRegistry implements
		StreamModel {

	private Map<CurveIdentifier, AnalysisRow> map;
	private AnalysisPeriod analysisPeriod;

	public StreamModelImpl(AnalysisPeriod analysisPeriod,
			Map<CurveIdentifier, AnalysisRow> map) {
		super("");
		this.analysisPeriod = analysisPeriod;
		this.map = map;
	}

	@Override
	public Collection<CurveIdentifier> getCurveIdentifiers() {
		return map.keySet();
	}

	@Override
	public AnalysisPeriod getAnalysisPeriod() {
		return analysisPeriod;
	}

	@Override
	public AnalysisRow getAnalysisRow(CurveIdentifier id) {
		return map.get(id);
	}

	@Override
	public Collection<AnalysisRow> getAnalysisRow() {
		return map.values();
	}

	@Override
	public StreamAssembler modify() {
		StreamAssembler assembler = StreamAssemblerImpl.create()
				.setAnalysisPeriod(analysisPeriod);
		map.entrySet().forEach(
				e -> assembler.add(e.getKey(), Op.constCurve(e.getValue())));
		return assembler;
	}

	@Override
	public Collection<RowReference> getCurveReferences() {
		return StreamUtil.map(map.keySet(), id -> new DefaultRowReference(id,
				this.getAnalysisRow(id)));
	}

	@Override
	public StreamModel mask(Set<CurveIdentifier> ids) {
		return new StreamModelImpl(analysisPeriod, map.entrySet().stream()
				.filter(e -> ids.contains(e.getClass()))
				.collect(Collectors.toMap(e -> e.getKey(), e -> e.getValue())));
	}

	@Override
	public StreamModel notIn(Set<CurveIdentifier> curveIds) {
		Set<CurveIdentifier> ids = new HashSet<>();
		return new StreamModelImpl(analysisPeriod, map.entrySet().stream()
				.filter(e -> !ids.contains(e.getClass()))
				.collect(Collectors.toMap(e -> e.getKey(), e -> e.getValue())));
	}

	
}
