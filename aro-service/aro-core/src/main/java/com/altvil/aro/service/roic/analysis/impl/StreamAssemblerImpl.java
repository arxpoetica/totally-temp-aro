package com.altvil.aro.service.roic.analysis.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.altvil.aro.service.roic.analysis.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.RoicAnalysis;
import com.altvil.aro.service.roic.analysis.calc.ResultStream;
import com.altvil.aro.service.roic.analysis.calc.StreamAccessor;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.spi.ResolveContext;
import com.altvil.aro.service.roic.analysis.spi.StreamAssembler;
import com.altvil.utils.StreamUtil;

public class StreamAssemblerImpl implements StreamAssembler {

	private int startYear;
	private int period;

	private Map<CurveIdentifier, StreamFunction> funcMap = new HashMap<>();
	private List<CurveIdentifier> outputCurves = new ArrayList<>();

	@Override
	public StreamAssembler setPeriod(int period) {
		return null;
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
	public RoicAnalysis resolveAndBuild() {
		return null;
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

		public void resolve() {
			resolveBindings();
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

}
