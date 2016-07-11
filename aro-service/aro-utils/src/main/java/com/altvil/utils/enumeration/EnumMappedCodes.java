package com.altvil.utils.enumeration;

import java.util.Collection;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import com.altvil.utils.StreamUtil;

public class EnumMappedCodes<S extends Enum<S>, D> implements MappedCodes<S, D> {

	public static <S extends Enum<S>, D> Builder<S, D> build(Class<S> enumType,
			Function<D, String> domainToCode) {

		return new Builder<S, D>(enumType, domainToCode);

	}

	public static <S extends Enum<S>, D> EnumMappedCodes<S, D> create(
			Map<S, D> srcToDomain) {

		Map<D, S> domainToSrc = new HashMap<>();

		for (Map.Entry<S, D> e : srcToDomain.entrySet()) {
			domainToSrc.put(e.getValue(), e.getKey());
		}

		return new EnumMappedCodes<>(srcToDomain, domainToSrc);

	}

	public static <S extends Enum<S>, D> EnumMappedCodes<S, D> create(
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

		return new EnumMappedCodes<>(srcToDomain, domainToSrc);

	}

	public static class Builder<S extends Enum<S>, D> {

		private Class<S> enumType;
		private Function<D, String> domainToCode;
		private Collection<S> sourcesCodes;

		private Function<S, String> sourceToCode;
		private Collection<D> domainCodes;

		public Builder(Class<S> enumType, Function<D, String> domainToCode) {
			super();
			this.enumType = enumType;
			this.domainToCode = domainToCode;
			sourcesCodes = StreamUtil.asList(enumType.getEnumConstants());
		}

		public Builder<S, D> toSourceToCodeFunc(Function<S, String> f) {
			this.sourceToCode = f;
			return this;
		}

		public Builder<S, D> setDomainCodes(Collection<D> domainCodes) {
			this.domainCodes = domainCodes;
			return this;
		}

		public EnumMappedCodes<S, D> build() {

			if (sourceToCode == null) {
				sourceToCode = (s) -> s.name();
			}

			Map<String, D> domainMapping = StreamUtil.hash(domainCodes,
					domainToCode);

			Map<S, D> sourceToDomainMap = new EnumMap<>(enumType);
			Map<D, S> domainToSourceMap = new HashMap<>();

			sourcesCodes
					.forEach(s -> {
						D d = domainMapping.get(sourceToCode.apply(s));
						if (d == null) {
							throw new RuntimeException("Failed to map "
									+ s.toString());
						}

						sourceToDomainMap.put(s, d);
						domainToSourceMap.put(d, s);

					});

			return new EnumMappedCodes<>(sourceToDomainMap, domainToSourceMap);

		}

	}

	Map<S, D> sourceToDomainMap;
	Map<D, S> domainToSourceMap;

	public EnumMappedCodes(Map<S, D> sourceToDomainMap,
			Map<D, S> domainToSourceMap) {
		super();
		this.sourceToDomainMap = sourceToDomainMap;
		this.domainToSourceMap = domainToSourceMap;
	}

	public Map<S, D> getSourceToDomainMap() {
		return sourceToDomainMap;
	}

	public void setSourceToDomainMap(Map<S, D> sourceToDomainMap) {
		this.sourceToDomainMap = sourceToDomainMap;
	}

	public Map<D, S> getDomainToSourceMap() {
		return domainToSourceMap;
	}

	public void setDomainToSourceMap(Map<D, S> domainToSourceMap) {
		this.domainToSourceMap = domainToSourceMap;
	}

	public S getSource(D domain) {
		return domainToSourceMap.get(domain);
	}

	public D getDomain(S code) {
		return sourceToDomainMap.get(code);
	}

}
