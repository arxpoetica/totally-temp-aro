package com.altvil.aro.service.network.model;

import com.altvil.interfaces.CableConduitEdge;

import java.io.Serializable;
import java.util.Collection;

@SuppressWarnings("serial")
public class PlanConduitEdges implements Serializable{
    Collection<CableConduitEdge> edges;

    public PlanConduitEdges(Collection<CableConduitEdge> edges) {
        this.edges = edges;
    }

    public Collection<CableConduitEdge> getEdges() {
        return edges;
    }
}

