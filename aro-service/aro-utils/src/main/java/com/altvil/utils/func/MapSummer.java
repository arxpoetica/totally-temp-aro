package com.altvil.utils.func;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;

public class MapSummer<K, V> implements Aggregator<Map<K, V>> {

	public static <K, V> MapSummer<K, V> createAggerator(Class<V> clz) {
		return new MapSummer<K, V>(createHashMap(), createHashMap(),
				AggregatorFactory.FACTORY.getAggregator(clz));
	}

	public static <K extends Enum<K>, V> MapSummer<K, V> createAggerator(
			Class<K> keyType, Class<V> valueType) {
		return new MapSummer<K, V>(createEnumMap(keyType),
				createEnumMap(keyType),
				AggregatorFactory.FACTORY.getAggregator(valueType));
	}

	public static <K, V> Aggregator<Map<K, V>> createAggregator(
			Supplier<Aggregator<V>> valueSupplier,
			Map<K, Aggregator<V>> aggregatorMap, Map<K, V> resultMap) {
		return new MapSummer<K, V>(aggregatorMap, resultMap, valueSupplier);
	}

	private static <K, T> Map<K, T> createHashMap() {
		return new HashMap<K, T>();
	}

	private static <K extends Enum<K>, T> Map<K, T> createEnumMap(Class<K> clz) {
		return new EnumMap<K, T>(clz);
	}

	private Map<K, Aggregator<V>> aggregatorMap;
	private Map<K, V> resultMap;

	private Supplier<Aggregator<V>> functor;

	public MapSummer(Map<K, Aggregator<V>> aggregatorMap,
			Map<K, V> resultMap, Supplier<Aggregator<V>> functor) {
		super();
		this.aggregatorMap = aggregatorMap;
		this.resultMap = resultMap;
		this.functor = functor;
	}

	@Override
	public void add(Map<K, V> map) {

		for (Map.Entry<K, V> e : map.entrySet()) {
			Aggregator<V> s = aggregatorMap.get(e.getKey());
			if (s == null) {
				aggregatorMap.put(e.getKey(), s = functor.get());
			}
			s.add(e.getValue());
		}
	}

	@Override
	public Map<K, V> apply() {

		for (Map.Entry<K, Aggregator<V>> e : aggregatorMap.entrySet()) {
			resultMap.put(e.getKey(), e.getValue().apply());
		}

		return resultMap;

	}

}
