package com.altvil.aro.service.roic.analysis.builder.impl;

import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.service.roic.analysis.model.RoicAnalysis;

public abstract class AbstractEnumAggregator<K extends Enum<K>, T, M extends RoicAnalysis>
		extends AbstractAggregator<K, T, M> {

	private Class<K> enumType;

	public AbstractEnumAggregator(Class<K> enumType) {
		super();
		this.enumType = enumType;
	}

	@Override
	protected Map<K, T> createMap() {
		return new EnumMap<>(enumType);
	}

}
