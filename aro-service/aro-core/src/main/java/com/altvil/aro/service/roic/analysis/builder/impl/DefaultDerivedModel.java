package com.altvil.aro.service.roic.analysis.builder.impl;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.roic.analysis.builder.spi.DerivedModel;

public class DefaultDerivedModel<K, M> implements DerivedModel<K, M> {

	private Map<K, List<M>> map;

	public DefaultDerivedModel(Map<K, List<M>> map) {
		super();
		this.map = map;
	}

	@Override
	public Set<K> keySet() {
		return map.keySet();
	}

	@Override
	public Collection<M> getSubComponents(K key) {
		return map.get(key);
	}

}
