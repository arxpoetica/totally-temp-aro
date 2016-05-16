package com.altvil.aro.service.conversion.impl;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import com.altvil.aro.service.conversion.ModelSerialization;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.BulkFiberTerminal;
import com.altvil.aro.service.entity.CentralOfficeEquipment;
import com.altvil.aro.service.entity.FDHEquipment;
import com.altvil.aro.service.entity.FDTEquipment;
import com.altvil.aro.service.entity.LocationDropAssignment;
import com.altvil.aro.service.entity.RemoteTerminal;
import com.altvil.aro.service.entity.SplicePoint;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;

public abstract class GraphMappingSerializer<T> {

	protected long planId ;
	
	private Map<GraphEdgeAssignment, T> resolvedMap = new HashMap<>();
	private Map<Class<? extends AroEntity>, SerializeStrategy<T>> strategyMap = new HashMap<>();
	
	public GraphMappingSerializer(long planId) {
		super();
		this.planId = planId ;
		init();
	}

	// --------------------------------- Internal Strategy Configuration

	private void init() {
		register(FDHEquipment.class, this::serializeFdh);
		register(RemoteTerminal.class, this::serializeRemoteTerminal); //Acts as a Source
		register(FDTEquipment.class, this::serializeFdt);
		register(CentralOfficeEquipment.class, this::serializeCentralOffice);
		register(SplicePoint.class, this::serializeSplicePoint);
		register(LocationDropAssignment.class, this::serializeLocationDropAssignment);
		register(BulkFiberTerminal.class, this::serializeBulkFiberTerminals);
	}

	@FunctionalInterface
	private interface SerializeStrategy<T> {
		public void serialize(T parent,
				GraphMapping graphMapping);
	}

	private void register(Class<? extends AroEntity> type,
			SerializeStrategy<T> strategy) {
		strategyMap.put(type, strategy);
	}

	// -------------------------------

	private SerializeStrategy<T> getSerializeStrategy(
			Class<? extends AroEntity> type) {

		SerializeStrategy<T> strategy = strategyMap.get(type);

		return strategy == null ? this::serializeUnknownType : strategy;
	}

	public void serialize(GraphMapping mapping) {
		serialize(null, mapping);
	}

	private void serialize(T parent,
			GraphMapping graphMapping) {

		getSerializeStrategy(graphMapping.getAroEntity().getType()).serialize(
				parent, graphMapping);
	}

	protected T register(GraphEdgeAssignment graphEdgeAssignment,
			T equipment) {
		if( equipment != null ) {
			resolvedMap.put(graphEdgeAssignment, equipment);
		}
		return equipment ;

	}

	protected void serialize(T parent,
			Collection<GraphMapping> mapping) {

		mapping.forEach(m -> {
			serialize(parent, m);
		});

	}

	protected abstract void serializeCentralOffice(T parent,
			GraphMapping graphMapping) ;

	protected abstract void serializeFdh(T parent,
			GraphMapping graphMapping) ;

	protected void serializeFdt(T parent,
			GraphMapping graphMapping) {
	}
	
	
	protected void serializeBulkFiberTerminals(T parent,
			GraphMapping graphMapping) {
	}
	
	protected void serializeRemoteTerminal(T parent,
			GraphMapping graphMapping) {
	}
	
	protected abstract void serializeSplicePoint(T parent, GraphMapping graphMapping) ;

	
	protected void serializeLocationDropAssignment(T parent, GraphMapping graphMapping) {
		
	}

	protected void serializeUnknownType(T parent,
			GraphMapping graphMapping) {
	}
	
	public T getValue(GraphEdgeAssignment assignment) {
		return resolvedMap.get(assignment) ;
	}

	public Collection<T> getValues() {
		return resolvedMap.values();
	}
	
	public Map<GraphEdgeAssignment, T> getMapping(){
		return resolvedMap ;
	}
	
	public  void commit(ModelSerialization<T> modelSerialization) {
		getValues().forEach(v-> modelSerialization.serialize(v));
	}

}