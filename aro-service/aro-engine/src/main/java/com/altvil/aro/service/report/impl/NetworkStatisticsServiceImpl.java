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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.optimization.strategy.spi.FinancialAnalysis;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysisService;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.report.NetworkStatistic;
import com.altvil.aro.service.report.NetworkStatisticType;
import com.altvil.aro.service.report.NetworkStatisticsService;
import com.altvil.aro.service.report.ReportGenerator;
import com.altvil.aro.service.report.ReportGenerator.AnalysisInput;
import com.altvil.aro.service.roic.RoicFinancialInput;
import com.altvil.utils.func.Aggregator;

@Service
public class NetworkStatisticsServiceImpl implements NetworkStatisticsService {

	private PlanAnalysisService planAnalysisService;

	private Map<NetworkStatisticType, NetworkStatisticGenerator> lineItemGenerators;

	@Autowired
	public NetworkStatisticsServiceImpl(PlanAnalysisService planAnalysisService) {
		super();
		this.planAnalysisService = planAnalysisService;
	}

	@Override
	public ReportGenerator createReportGenerator() {
		return new ReportGeneratorSpi(lineItemGenerators);
	}

	@PostConstruct
	void postConstruct() {
		lineItemGenerators = new Builder()
				.add(NetworkStatisticType.irr,
						(ctx, plan) -> ctx.getFinancialAnalysis().getIrr())
				.add(NetworkStatisticType.npv,
						(ctx, plan) -> ctx.getFinancialAnalysis().getNpv())
				.add(NetworkStatisticType.roic_irr,
						(ctx, plan) -> ctx.getFinancialAnalysis().getRoicIrr())
				.add(NetworkStatisticType.roic_npv,
						(ctx, plan) -> ctx.getFinancialAnalysis().getRoicNpv())
				.build();

	}

	@Override
	public NetworkStatistic createNetworkStatistic(NetworkStatisticType type,
			double value) {
		return new DefaultNetworkStatistic(type, value);
	}

	private static class Builder {

		private Map<NetworkStatisticType, NetworkStatisticGenerator> lineItemGenerators = new EnumMap<>(
				NetworkStatisticType.class);

		public Builder add(NetworkStatisticType type,
				GeneratorFunc<AnalysisInput> scalarFunc,
				GeneratorFunc<List<NetworkStatistic>> aggragteFunc) {

			lineItemGenerators.put(type, new NetworkStatisticGenerator(type,
					scalarFunc, aggragteFunc));

			return this;
		}

		public Builder add(NetworkStatisticType type,
				GeneratorFunc<AnalysisInput> scalarFunc) {
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

		private RoicFinancialInput toNetworkFinancialInput(
				NetworkDemandSummary networkDemandSummary, double fixedCosts) {
			return new RoicFinancialInput() {
				@Override
				public double getFixedCosts() {
					return fixedCosts;
				}

				@Override
				public NetworkDemandSummary getDemandSummary() {
					return networkDemandSummary;
				}
			};

		}

		@Override
		public Collection<NetworkStatistic> createNetworkStatistic(
				AnalysisInput input) {

			FinancialAnalysis fa = planAnalysisService.createFinancialAnalysis(
					toNetworkFinancialInput(input.getNetworkDemandSummary(),
							input.getFixedCost()), input.getYears(), input
							.getDiscountRate());

			return new ScalarReducer(lineItemGenerators, input, fa).generate();

		}

		@Override
		public Aggregator<Collection<NetworkStatistic>> createAggregator() {
			return new StatisticAggregator(this);
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
		private GeneratorFunc<AnalysisInput> scalarFunc;
		private GeneratorFunc<List<NetworkStatistic>> aggregateFunc;

		public NetworkStatisticGenerator(NetworkStatisticType type,
				GeneratorFunc<AnalysisInput> scalarFunc,
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

		public GeneratorFunc<AnalysisInput> getScalarFunc() {
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
		private FinancialAnalysis financialAnalysis;

		private Map<NetworkStatisticType, NetworkStatistic> map = new EnumMap<>(
				NetworkStatisticType.class);

		public ReducerContext(
				Map<NetworkStatisticType, NetworkStatisticGenerator> lineItemGeneratorsMap,
				FinancialAnalysis financialAnalysis) {
			super();
			this.lineItemGeneratorsMap = lineItemGeneratorsMap;
			this.financialAnalysis = financialAnalysis;
		}

		public FinancialAnalysis getFinancialAnalysis() {
			return financialAnalysis;
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
			super(lineItemGeneratorsMap, null);
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
		private AnalysisInput plan;

		public ScalarReducer(
				Map<NetworkStatisticType, NetworkStatisticGenerator> lineItemGeneratorsMap,
				AnalysisInput plan, FinancialAnalysis financialAnalysis) {
			super(lineItemGeneratorsMap, financialAnalysis);
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

		public StatisticAggregator(ReportGeneratorSpi reportGenerator) {
			super();
			this.reportGenerator = reportGenerator;
		}

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

		// public static NetworkStatistic create(NetworkStatisticType type,
		// double val) {
		// return new DefaultNetworkStatistic(type, val);
		// }

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

			if (value == null) {
				return 0.0;
			}
			return value.stream().mapToDouble(NetworkStatistic::getValue).sum();
		}
	}

	public static class Sum implements GeneratorFunc<List<NetworkStatistic>> {

		public static final Sum FUNC = new Sum();

		@Override
		public Double generate(ReducerContext ctx, List<NetworkStatistic> value) {

			if (value == null) {
				return 0.0;
			}

			OptionalDouble result = value.stream()
					.mapToDouble(NetworkStatistic::getValue).average();
			return result.isPresent() ? result.getAsDouble() : 0.0;
		}
	}

}
