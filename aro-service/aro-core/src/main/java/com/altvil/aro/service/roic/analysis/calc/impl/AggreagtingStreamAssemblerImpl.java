package com.altvil.aro.service.roic.analysis.calc.impl;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.calc.AggregatingStreamAssembler;
import com.altvil.aro.service.roic.analysis.calc.StreamAssembler;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.calc.StreamModel;
import com.altvil.aro.service.roic.analysis.model.curve.AnalysisRow;
import com.altvil.aro.service.roic.analysis.model.curve.DefaultAnalyisRow;
import com.altvil.aro.service.roic.analysis.model.curve.RowReference;
import com.altvil.aro.service.roic.analysis.op.Op;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;
import com.altvil.utils.StreamUtil;

public class AggreagtingStreamAssemblerImpl implements
		AggregatingStreamAssembler {

	public static AggregatingStreamAssembler create(
			Collection<StreamModel> models) {
		return new AggreagtingStreamAssemblerImpl(toMap(models));
	}

	private static Map<CurveIdentifier, List<RowReference>> toMap(
			Collection<StreamModel> models) {
		return models.stream().flatMap(m -> m.getCurveReferences().stream())
				.collect(Collectors.groupingBy(RowReference::getIdentifier));
	}

	private StreamAssembler assembler;
	private Map<CurveIdentifier, List<RowReference>> curves;

	private AggreagtingStreamAssemblerImpl(
			Map<CurveIdentifier, List<RowReference>> curves) {
		super();
		this.curves = curves;
		this.assembler = new StreamAssemblerImpl();
	}

	private AnalysisRow sum(CurveIdentifier id) {
		return DefaultAnalyisRow.sum(StreamUtil.map(curves.get(id),
				RowReference::getAnalysisRow));
	}

	@Override
	public AggregatingStreamAssembler add(CurveIdentifier... ids) {
		for (CurveIdentifier id : ids) {
			add(id, Op.constCurve(sum(id)));
			addOutput(id);
		}

		return this;
	}

	@Override
	public StreamAssembler add(StreamModel sm) {
		assembler.add(sm);
		return this;
	}

	@Override
	public StreamAssembler setAnalysisPeriod(AnalysisPeriod period) {
		assembler.setAnalysisPeriod(period);
		return this;
	}

	@Override
	public StreamAssembler add(CurveIdentifier id, StreamFunction f) {
		assembler.add(id, f);
		return this;
	}

	@Override
	public StreamAssembler addOutput(CurveIdentifier id) {
		assembler.addOutput(id);
		return this;
	}

	@Override
	public StreamModel resolveAndBuild() {
		return assembler.resolveAndBuild();
	}

}
