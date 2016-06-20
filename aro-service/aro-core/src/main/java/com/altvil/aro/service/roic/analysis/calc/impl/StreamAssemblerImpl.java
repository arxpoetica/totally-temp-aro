package com.altvil.aro.service.roic.analysis.calc.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.RowReference;
import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.ResolveContext;
import com.altvil.aro.service.roic.analysis.calc.ResultStream;
import com.altvil.aro.service.roic.analysis.calc.StreamAccessor;
import com.altvil.aro.service.roic.analysis.calc.StreamAssembler;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.calc.StreamModel;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;
import com.altvil.utils.StreamUtil;

public class StreamAssemblerImpl implements StreamAssembler {

	private AnalysisPeriod analysisPeriod ;

	private Map<CurveIdentifier, StreamFunction> funcMap = new HashMap<>();
	private List<CurveIdentifier> outputCurves = new ArrayList<>();

	
	@Override
	public StreamAssembler setAnalysisPeriod(AnalysisPeriod period) {
		this.analysisPeriod = period ;
		return this;
	}

	@Override
	public StreamAssembler add(CurveIdentifier id, StreamFunction f) {
		funcMap.put(id, f);
		return this;
	}

	@Override
	public StreamAssembler addOutput(CurveIdentifier id) {
		outputCurves.add(id);
		return this;
	}

	@Override
	public StreamModel resolveAndBuild() {

		return new RoicBuilder(analysisPeriod.getStartYear(), analysisPeriod.getPeriods(),
				new Resolver(funcMap).resolve()).buildAndRun(outputCurves);

	}

	private static class Binding {
		private StreamFunction streamFunction;
		private StreamAccessor streamAccessor;

		public Binding(StreamFunction streamFunction, int index) {
			super();
			this.streamFunction = streamFunction;
			streamAccessor = new StreamAccessorImpl(index);
		}

		public StreamFunction getStreamFunction() {
			return streamFunction;
		}

		public StreamAccessor getStreamAccessor() {
			return streamAccessor;
		}

	}

	private static class StreamAccessorImpl implements StreamAccessor {

		private int index;

		public StreamAccessorImpl(int index) {
			super();
			this.index = index;
		}

		@Override
		public double getValue(ResultStream rs) {
			return ((ResultStreamImpl) rs).doubleResult[index];
		}

	}

	private static class ResultStreamImpl implements ResultStream {

		private ResultStreamImpl(int size) {
			doubleResult = new double[size];
		}

		private double[] doubleResult;
	}

	private static class Resolver implements ResolveContext {

		private Map<CurveIdentifier, StreamFunction> funcMap = new HashMap<>();
		private Map<CurveIdentifier, Binding> resolved = new LinkedHashMap<>();

		private int index = 0;

		public Resolver(Map<CurveIdentifier, StreamFunction> funcMap) {
			super();
			this.funcMap = funcMap;
		}

		public Resolver resolve() {
			resolveBindings();
			return this;
		}

		public List<StreamFunction> getOrderedStreamFunctions() {
			return StreamUtil
					.map(resolved.values(), Binding::getStreamFunction);
		}

		private void resolveBindings() {
			for (CurveIdentifier id : funcMap.keySet()) {
				resolveBinding(id);
			}
		}

		private Binding createBinding(StreamFunction f) {
			return new Binding(f, index++);
		}

		private Binding resolveBinding(CurveIdentifier id) {
			
			Binding b = resolved.get(id);
			if (b == null) {
				StreamFunction f = funcMap.get(id);
				
				if( f == null ) {
					throw new RuntimeException("No Function defined for " + id) ;
				}
				
				f.resolve(this);
				resolved.put(id, b = createBinding(f));
			}
			return b;
		}

		private StreamAccessor createStreamAccessor(Binding binding) {
			return binding.getStreamAccessor();
		}

		@Override
		public StreamAccessor getStreamAccessor(CurveIdentifier id) {
			return createStreamAccessor(resolveBinding(id));
		}
	}

	private static class Row implements RowReference, AnalysisRow {

		private CurveIdentifier curveId;
		private double value[];

		public Row(CurveIdentifier curveId, int size) {
			this.curveId = curveId;
			this.value = new double[size];
		}

		public void setValue(int period, double v) {
			value[period] = v;
		}

		@Override
		public CurveIdentifier getIdentifier() {
			return curveId;
		}

		@Override
		public AnalysisRow getAnalysisRow() {
			return this;
		}

		@Override
		public int getSize() {
			return value.length;
		}

		@Override
		public double getValue(int period) {
			return value[period];
		}

	}

	private static class CalcContextImpl implements CalcContext {

		private ResultStreamImpl resultStream;
		private int startYear;
		private int curentYear;
		private int index;

		public CalcContextImpl(int startYear, ResultStreamImpl resultStream) {
			super();
			this.startYear = startYear;
			this.resultStream = resultStream;
		}

		@Override
		public int getCurrentYear() {
			return curentYear;
		}

		public void inc() {
			index++;
			curentYear = startYear + index;
		}

		@Override
		public int getPeriod() {
			return index;
		}

		@Override
		public ResultStream getResultStream() {
			return resultStream;
		}

	}

	private static class RowBinding {
		private CurveIdentifier id;
		private StreamAccessor streamAccessor;
		private Row row;

		public RowBinding(CurveIdentifier id, StreamAccessor streamAccessor,
				Row row) {
			super();
			this.id = id;
			this.streamAccessor = streamAccessor;
			this.row = row;
		}

		public void update(CalcContextImpl ctx) {
			row.setValue(ctx.getPeriod(),
					streamAccessor.getValue(ctx.getResultStream()));
		}

		public CurveIdentifier getCurveIdentifier() {
			return id;
		}

		public AnalysisRow getAnalysisRow() {
			return row;
		}

	}


	private static class RoicBuilder {

		private int startYear;
		private int size;
		private Resolver resolver;

		private List<StreamFunction> streamFunctions;

		public RoicBuilder(int startYear, int size, Resolver resolver) {
			super();
			this.startYear = startYear;
			this.size = size;
			this.resolver = resolver;

			this.streamFunctions = resolver.getOrderedStreamFunctions();
		}

		public StreamModel buildAndRun(List<CurveIdentifier> ids) {
			List<RowBinding> rowBindings = bindRows(ids);
			run(rowBindings);
			return new StreamModelImpl(new AnalysisPeriod(startYear, size), resolveRows(rowBindings));
		}

		private Map<CurveIdentifier, AnalysisRow> resolveRows(
				List<RowBinding> rowBindings) {
			Map<CurveIdentifier, AnalysisRow> map = new HashMap<>();
			rowBindings.forEach(b -> {
				map.put(b.getCurveIdentifier(), b.getAnalysisRow());
			});
			return map;

		}

		private RowBinding createRowBinding(CurveIdentifier id) {
			return new RowBinding(id, resolver.getStreamAccessor(id), new Row(
					id, size));
		}

		private List<RowBinding> bindRows(List<CurveIdentifier> ids) {
			return StreamUtil.map(ids, this::createRowBinding);
		}

		private void run(List<RowBinding> rowBindings) {

			CalcContextImpl ctx = new CalcContextImpl(startYear,
					new ResultStreamImpl(streamFunctions.size()));

			double[] result = ctx.resultStream.doubleResult;

			for (int i = 0; i < size; i++) {
				for (int fi = 0; fi < streamFunctions.size(); fi++) {
					result[fi] = streamFunctions.get(fi).calc(ctx);
				}
				streamFunctions.forEach(f -> f.calc(ctx));
				rowBindings.forEach(b -> b.update(ctx));
				ctx.inc();
			}

		}

	}

}