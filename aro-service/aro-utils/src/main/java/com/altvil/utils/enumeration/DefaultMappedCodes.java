package com.altvil.utils.enumeration;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;

public class DefaultMappedCodes<S, D> implements MappedCodes<S, D> {

	public static <S extends Enum<S>, D extends Enum<D>> Builder<S, D> build(
			Class<S> sourceType, Class<D> domainType) {
		return new Builder<S, D>(new EnumMap<S, D>(sourceType),
				new EnumMap<D, S>(domainType));
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

	private Map<S, D> sourceToDomainMap;
	private Map<D, S> domainToSourceMap;

	public DefaultMappedCodes(Map<S, D> sourceToDomainMap,
			Map<D, S> domainToSourceMap) {
		super();
		this.sourceToDomainMap = sourceToDomainMap;
		this.domainToSourceMap = domainToSourceMap;
	}

	@Override
	public S getSource(D domain) {
		return domainToSourceMap.get(domain);
	}

	@Override
	public D getDomain(S source) {
		return sourceToDomainMap.get(source);
	}

}
