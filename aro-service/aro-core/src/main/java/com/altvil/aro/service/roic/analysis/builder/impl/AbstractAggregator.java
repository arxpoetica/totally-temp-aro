package com.altvil.aro.service.roic.analysis.builder.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.builder.Aggregator;
import com.altvil.aro.service.roic.analysis.builder.spi.DerivedModel;
import com.altvil.aro.service.roic.analysis.model.RoicAnalysis;

public abstract class AbstractAggregator<K, T, M extends RoicAnalysis>
		implements Aggregator<K, M> {

	private List<M> models = new ArrayList<>();
	private Set<K> selectedTypes = new HashSet<>();

	@Override
	public Aggregator<K, M> add(M model) {
		models.add(model);
		return this;
	}

	@Override
	public Aggregator<K, M> select(K type) {
		selectedTypes.add(type);
		return this;
	}

	@Override
	public Aggregator<K, M> addAll(Collection<M> models) {
		this.models.addAll(models);
		return this;
	}

	protected Set<K> getSelectedTypes(DerivedModel<K, T> dt) {
		return selectedTypes.size() == 0 ? dt.keySet() : selectedTypes;
	}

	@Override
	public M sum() {
		inferState(models) ; 
		return toRoicModel(inferAnalysisPeriod(models), toComponentMap(models));
	}
	
	protected void inferState(Collection<M> models) {
	}
	

	protected AnalysisPeriod inferAnalysisPeriod(Collection<M> models) {
		return models.iterator().next().getAnalysisPeriod();
	}

	protected Map<K, T> toComponentMap(Collection<M> models) {

		Map<K, T> result = createMap() ;

		DerivedModel<K, T> derivedModel = transform(models);

		getSelectedTypes(derivedModel).forEach(k -> {
			result.put(k, reduce(k, derivedModel.getSubComponents(k)));
		});
		return result;
	}
	
	protected Map<K,T> createMap() {
		return new HashMap<>() ;
	}

	protected abstract T reduce(K key, Collection<T> components);

	protected abstract DerivedModel<K, T> transform(Collection<M> models);

	protected abstract M toRoicModel(AnalysisPeriod period,
			Map<K, T> componentMap);

}
