package com.altvil.aro.service.report.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.report.GeneratedPlan;
import com.altvil.aro.service.report.NetworkStatistic;
import com.altvil.aro.service.report.NetworkStatisticType;
import com.altvil.aro.service.report.NetworkStatisticsService;
import com.altvil.aro.service.report.ReportGenerator;
import com.altvil.utils.func.Aggregator;

@Service
public class NetworkStatisticsServiceImpl implements NetworkStatisticsService {

	private Map<NetworkStatisticType, NetworkStatisticGenerator> lineItemGenerators;

	@Override
	public ReportGenerator createReportGenerator() {
		return new ReportGeneratorSpi(lineItemGenerators);
	}

	@PostConstruct
	void postConstruct() {
		lineItemGenerators = new Builder()
				.add(NetworkStatisticType.irr, (ctx, plan) -> 0.0)
				.add(NetworkStatisticType.npv, (ctx, plan) -> 0.0).build();

	}

	private static class Builder {

		private Map<NetworkStatisticType, NetworkStatisticGenerator> lineItemGenerators = new EnumMap<>(
				NetworkStatisticType.class);

		public Builder add(NetworkStatisticType type,
				GeneratorFunc<GeneratedPlan> scalarFunc,
				GeneratorFunc<List<NetworkStatistic>> aggragteFunc) {

			lineItemGenerators.put(type, new NetworkStatisticGenerator(type,
					scalarFunc, aggragteFunc));

			return this;
		}

		public Builder add(NetworkStatisticType type,
				GeneratorFunc<GeneratedPlan> scalarFunc) {
			return add(type, scalarFunc, Average.FUNC);
		}

		public Map<NetworkStatisticType, NetworkStatisticGenerator> build() {
			return lineItemGenerators;
		}

	}

	public class ReportGeneratorSpi implements ReportGenerator {

		private Map<NetworkStatisticType, NetworkStatisticGenerator> lineItemGenerators;

		public ReportGeneratorSpi(
				Map<NetworkStatisticType, NetworkStatisticGenerator> lineItemGenerators) {
			super();
			this.lineItemGenerators = lineItemGenerators;
		}

		/*
		 * (non-Javadoc)
		 * 
		 * @see com.altvil.aro.service.cost.impl.ReportGenerator#
		 * generateNetworkStatistics
		 * (com.altvil.aro.service.optimization.OptimizedPlan)
		 */
		@Override
		public Collection<NetworkStatistic> generateNetworkStatistics(
				GeneratedPlan plan) {
			return new ScalarReducer(lineItemGenerators, plan).generate();
		}

		/*
		 * (non-Javadoc)
		 * 
		 * @see
		 * com.altvil.aro.service.cost.impl.ReportGenerator#createAggregator()
		 */
		@Override
		public Aggregator<Collection<NetworkStatistic>> createAggregator() {
			return new StatisticAggregator();
		}

		private Collection<NetworkStatistic> generateNetworkStatistics(
				Collection<NetworkStatistic> networkStats) {

			return new AggregateReducer(
					lineItemGenerators,
					networkStats
							.stream()
							.collect(
									Collectors
											.groupingBy(NetworkStatistic::getNetworkStatisticType)))
					.generate();
		}
	}

	private static final Logger log = LoggerFactory
			.getLogger(ReportGeneratorSpi.class.getName());

	private static class NetworkStatisticGenerator {

		private NetworkStatisticType type;
		private GeneratorFunc<GeneratedPlan> scalarFunc;
		private GeneratorFunc<List<NetworkStatistic>> aggregateFunc;

		public NetworkStatisticGenerator(NetworkStatisticType type,
				GeneratorFunc<GeneratedPlan> scalarFunc,
				GeneratorFunc<List<NetworkStatistic>> aggregateFunc) {
			super();
			this.type = type;
			this.scalarFunc = scalarFunc;
			this.aggregateFunc = aggregateFunc;
		}

		@SuppressWarnings("unused")
		public NetworkStatisticType getType() {
			return type;
		}

		public GeneratorFunc<GeneratedPlan> getScalarFunc() {
			return scalarFunc;
		}

		public GeneratorFunc<List<NetworkStatistic>> getAggregateFunc() {
			return aggregateFunc;
		}

	}

	private interface GeneratorFunc<T> {
		Double generate(ReducerContext ctx, T value);
	}

	private abstract static class ReducerContext {
		private Map<NetworkStatisticType, NetworkStatisticGenerator> lineItemGeneratorsMap;

		private Map<NetworkStatisticType, NetworkStatistic> map = new EnumMap<>(
				NetworkStatisticType.class);

		public ReducerContext(
				Map<NetworkStatisticType, NetworkStatisticGenerator> lineItemGeneratorsMap) {
			super();
			this.lineItemGeneratorsMap = lineItemGeneratorsMap;
		}

		protected NetworkStatisticGenerator getGenerator(
				NetworkStatisticType type) {
			return lineItemGeneratorsMap.get(type);
		}

		protected abstract NetworkStatistic reduce(NetworkStatisticType type);

		public NetworkStatistic getNetworkStatistic(NetworkStatisticType type) {
			if (!map.containsKey(type)) {
				map.put(type, reduce(type));
			}
			return map.get(type);
		}

		public Collection<NetworkStatistic> generate() {
			lineItemGeneratorsMap.keySet().forEach(this::getNetworkStatistic);
			return map.values();
		}
	}

	private static class AggregateReducer extends ReducerContext {

		private Map<NetworkStatisticType, List<NetworkStatistic>> srcData;

		public AggregateReducer(
				Map<NetworkStatisticType, NetworkStatisticGenerator> lineItemGeneratorsMap,
				Map<NetworkStatisticType, List<NetworkStatistic>> srcData) {
			super(lineItemGeneratorsMap);
			this.srcData = srcData;
		}

		@Override
		protected NetworkStatistic reduce(NetworkStatisticType type) {
			return DefaultNetworkStatistic.create(
					type,
					() -> getGenerator(type).getAggregateFunc().generate(this,
							srcData.get(type)));
		}

	}

	private static class ScalarReducer extends ReducerContext {
		private GeneratedPlan plan;

		public ScalarReducer(
				Map<NetworkStatisticType, NetworkStatisticGenerator> lineItemGeneratorsMap,
				GeneratedPlan plan) {
			super(lineItemGeneratorsMap);
			this.plan = plan;
		}

		@Override
		protected NetworkStatistic reduce(NetworkStatisticType type) {
			return DefaultNetworkStatistic.create(
					type,
					() -> getGenerator(type).getScalarFunc().generate(this,
							plan));

		}

	}

	private static class StatisticAggregator implements
			Aggregator<Collection<NetworkStatistic>> {

		private List<NetworkStatistic> networkStats = new ArrayList<>();
		private ReportGeneratorSpi reportGenerator;

		@Override
		public void add(Collection<NetworkStatistic> val) {
			networkStats.addAll(val);
		}

		@Override
		public Collection<NetworkStatistic> apply() {
			return reportGenerator.generateNetworkStatistics(networkStats);
		}

	}

	private static class DefaultNetworkStatistic implements NetworkStatistic {

		public static NetworkStatistic create(NetworkStatisticType type,
				Supplier<Double> supplier) {
			return new DefaultNetworkStatistic(type, eval(supplier));
		}

		private static double eval(Supplier<Double> supplier) {
			try {
				return supplier.get();
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
				return Double.NaN;
			}
		}

		private NetworkStatisticType type;
		private double val;

		public DefaultNetworkStatistic(NetworkStatisticType type, double val) {
			super();
			this.type = type;
			this.val = val;
		}

		@Override
		public NetworkStatisticType getNetworkStatisticType() {
			return type;
		}

		@Override
		public double getValue() {
			return val;
		}
	}

	public static class Average implements
			GeneratorFunc<List<NetworkStatistic>> {

		public static final Average FUNC = new Average();

		@Override
		public Double generate(ReducerContext ctx, List<NetworkStatistic> value) {
			return value.stream().mapToDouble(NetworkStatistic::getValue).sum();
		}
	}

	public static class Sum implements GeneratorFunc<List<NetworkStatistic>> {

		public static final Sum FUNC = new Sum();

		@Override
		public Double generate(ReducerContext ctx, List<NetworkStatistic> value) {
			OptionalDouble result = value.stream()
					.mapToDouble(NetworkStatistic::getValue).average();
			return result.isPresent() ? result.getAsDouble() : 0.0;
		}
	}

}
