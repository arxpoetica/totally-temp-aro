package com.altvil.aro.service.graph.transform;

import java.util.function.Function;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;

public interface GraphTransformer<E extends AroEdge, T> extends Function<GraphModel<E>,T> {

}
