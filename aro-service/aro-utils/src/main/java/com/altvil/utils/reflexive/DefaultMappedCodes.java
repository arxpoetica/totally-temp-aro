package com.altvil.utils.reflexive;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

public class DefaultMappedCodes<S, D> implements MappedCodes<S, D> {

	public static <S extends Enum<S>, D extends Enum<D>> Builder<S, D> build(
			Class<S> sourceType, Class<D> domainType) {
		return new Builder<S, D>(new EnumMap<S, D>(sourceType),
				new EnumMap<D, S>(domainType));
	}
	
	
	public static <S, D> DefaultMappedCodes<S, D> createMapping(
			Map<S, D> srcToDomain) {

		Map<D, S> domainToSrc = new HashMap<>();

		for (Map.Entry<S, D> e : srcToDomain.entrySet()) {
			domainToSrc.put(e.getValue(), e.getKey());
		}

		return new DefaultMappedCodes<>(srcToDomain, domainToSrc);

	}

	public static <S extends Enum<S>, D> DefaultMappedCodes<S, D> create(
			Map<S, D> srcToDomain) {

		Map<D, S> domainToSrc = new HashMap<>();

		for (Map.Entry<S, D> e : srcToDomain.entrySet()) {
			domainToSrc.put(e.getValue(), e.getKey());
		}

		return new DefaultMappedCodes<>(srcToDomain, domainToSrc);

	}

	public static <S extends Enum<S>> MappedCodes<S, Integer> createEnumMapping(
			Class<S> clz) {
		return createEnumMapping(clz, Enum::ordinal);
	}

	public static <S extends Enum<S>> MappedCodes<S, Integer> createEnumMapping(
			Class<S> clz, Function<S, Integer> f) {
		Map<S, Integer> srcMap = new EnumMap<>(clz);
		Map<Integer, S> destMap = new HashMap<>();

		for (S e : clz.getEnumConstants()) {
			Integer d = f.apply(e);
			srcMap.put(e, d);
			destMap.put(d, e);
		}

		return new DefaultMappedCodes<>(srcMap, destMap);
	}

	public static <S extends Enum<S>, D> DefaultMappedCodes<S, D> create(
			Class<S> enumType, Function<Integer, D> domianMap) {

		Map<S, D> srcToDomain = new EnumMap<>(enumType);
		Map<D, S> domainToSrc = new HashMap<>();

		for (S s : enumType.getEnumConstants()) {
			D d = domianMap.apply(s.ordinal());
			if (d == null) {
				throw new RuntimeException("Undefined Mapping " + s);
			}
			srcToDomain.put(s, d);
			domainToSrc.put(d, s);

		}

		return new DefaultMappedCodes<>(srcToDomain, domainToSrc);

	}

	public static <S, D> Builder<S, D> build() {
		return new Builder<>(new HashMap<S, D>(), new HashMap<D, S>());
	}

	public static class Builder<S, D> {

		private Map<S, D> sourceToDomainMap;
		private Map<D, S> domainToSourceMap;

		public Builder(Map<S, D> sourceToDomainMap, Map<D, S> domainToSourceMap) {
			super();
			this.sourceToDomainMap = sourceToDomainMap;
			this.domainToSourceMap = domainToSourceMap;
		}

		public Builder<S, D> add(S s, D d) {
			sourceToDomainMap.put(s, d);
			domainToSourceMap.put(d, s);
			return this;
		}

		public MappedCodes<S, D> build() {
			return new DefaultMappedCodes<S, D>(sourceToDomainMap,
					domainToSourceMap);
		}
	}

	//
	//
	//

	private Map<S, D> sourceToDomainMap;
	private Map<D, S> domainToSourceMap;

	public DefaultMappedCodes(Map<S, D> sourceToDomainMap,
			Map<D, S> domainToSourceMap) {
		this.sourceToDomainMap = sourceToDomainMap;
		this.domainToSourceMap = domainToSourceMap;
	}

	@Override
	public MappedCodes<D, S> flip() {
		return new DefaultMappedCodes<>(domainToSourceMap, sourceToDomainMap);
	}

	@Override
	public Set<S> getSourceCodes() {
		return sourceToDomainMap.keySet();
	}

	@Override
	public S getSource(D domain) {
		return domainToSourceMap.get(domain);
	}

	@Override
	public D getDomain(S source) {
		return sourceToDomainMap.get(source);
	}

	@Override
	public <T> MappedCodes<T, D> reindexSource(Function<S, T> f) {

		Map<T, D> srcMap = new HashMap<>();
		Map<D, T> destMap = new HashMap<>();

		for (Map.Entry<S, D> e : sourceToDomainMap.entrySet()) {

			S s = e.getKey();
			D d = e.getValue();
			T t = f.apply(s);

			srcMap.put(t, d);
			destMap.put(d, t);

		}

		return new DefaultMappedCodes<T, D>(srcMap, destMap);

	}

	@Override
	public <T> MappedCodes<S, T> reindexDomain(Function<D, T> f) {

		Map<S, T> srcMap = new HashMap<>();
		Map<T, S> destMap = new HashMap<>();

		for (Map.Entry<S, D> e : sourceToDomainMap.entrySet()) {

			S s = e.getKey();
			D d = e.getValue();
			T t = f.apply(d);

			srcMap.put(s, t);
			destMap.put(t, s);

		}

		return new DefaultMappedCodes<S, T>(srcMap, destMap);

	}

}
