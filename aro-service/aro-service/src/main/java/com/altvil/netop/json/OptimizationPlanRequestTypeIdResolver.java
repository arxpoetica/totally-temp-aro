package com.altvil.netop.json;

import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.optimization.impl.CapexOptimizationPlanImpl;
import com.altvil.aro.service.planning.optimization.impl.NpvOptimizationPlanImpl;
import com.altvil.enumerations.FiberPlanAlgorithm;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeInfo.Id;
import com.fasterxml.jackson.databind.DatabindContext;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.jsontype.TypeIdResolver;
import com.fasterxml.jackson.databind.type.TypeFactory;

// TODO Evaluate whether a DeserializationContext can be created that ties into Spring's context such that the strategy service can be used to look up enum-specific factories that return the appropriate request type for the context.
public class OptimizationPlanRequestTypeIdResolver implements TypeIdResolver {
	private JavaType baseType;
	private JavaType defaultType;
	private final Map<FiberPlanAlgorithm, JavaType> javaTypeByAlgorithm= new EnumMap<FiberPlanAlgorithm, JavaType>(FiberPlanAlgorithm.class);
	
	@Override
	public void init(JavaType baseType) {
		this.baseType = baseType;
		
		javaTypeByAlgorithm.put(FiberPlanAlgorithm.NPV, javaType(NpvOptimizationPlanImpl.class));
		javaTypeByAlgorithm.put(FiberPlanAlgorithm.CAPEX, javaType(CapexOptimizationPlanImpl.class));
		
		assert allEnumerationsResolved(FiberPlanAlgorithm.class);
		
		defaultType = javaTypeByAlgorithm.get(FiberPlanAlgorithm.CAPEX);
	}

	private boolean allEnumerationsResolved(Class<?> enumClass) {
		try {
			Object[] values = (Object[]) enumClass.getDeclaredMethod("values").invoke(enumClass);
			
			return javaTypeByAlgorithm.size() == values.length;
		} catch (Exception e) {
		}
		return false;
	}

	private JavaType javaType(Class<?> clazz) {
		return TypeFactory.defaultInstance().constructSpecializedType(baseType, clazz);
	}

	@Override
	public String idFromValue(Object value) {
		OptimizationPlan request = (OptimizationPlan) value;
		
		return request.getAlgorithm() == null ? "undefined" : request.getAlgorithm().toString();
	}

	@Override
	public String idFromValueAndType(Object value, Class<?> suggestedType) {
		return idFromValue(value);
	}

	@Override
	public String idFromBaseType() {
		return "undefined";
	}

	@SuppressWarnings("deprecation")
	@Override
	public JavaType typeFromId(String id) {
		try {
			FiberPlanAlgorithm algorithm = Enum.valueOf(FiberPlanAlgorithm.class, id);
			return javaTypeByAlgorithm.get(algorithm);
		} catch (NullPointerException e) {
			return defaultType;
		} catch (IllegalArgumentException e) {
			if ("undefined".equals(id)) {
				return defaultType;
			}
		}
		
		throw new IllegalArgumentException("The algorithm '" + id + "' is invalid.");
	}

	@Override
	public JavaType typeFromId(DatabindContext context, String id) {
		return typeFromId(id);
	}

	@Override
	public Id getMechanism() {
		return JsonTypeInfo.Id.CUSTOM;
	}

}
