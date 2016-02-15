package com.altvil.aro.service.graph.transform;

import java.util.function.Function;

import com.altvil.aro.service.graph.DAGModel;

public interface GraphTransformer<S, T> extends Function<DAGModel<S>, T> {

}
