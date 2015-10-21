package com.altvil.aro.service.graph.transform;

import java.util.function.Function;

import com.altvil.aro.service.graph.GraphModel;

public interface GraphTransformer<S, T> extends Function<GraphModel<S>, T> {

}
