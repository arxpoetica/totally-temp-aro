package com.altvil.aro.service.graph.transform;

import java.util.function.Function;

import com.altvil.aro.service.graph.GraphModel;

public interface GraphTransformer<T> extends Function<GraphModel,T> {

}
