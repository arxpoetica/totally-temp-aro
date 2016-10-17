package com.altvil.aro.service.optimization.strategy.impl;

import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;

import java.util.Collection;

public class SingleAreaAnalysis {
    private PrunedNetwork prunedNetwork;

    private Collection<PlanAnalysis> planAnalysises;

    public SingleAreaAnalysis(PrunedNetwork prunedNetwork, Collection<PlanAnalysis> planAnalysises) {
        this.prunedNetwork = prunedNetwork;
        this.planAnalysises = planAnalysises;
    }

    public Collection<PlanAnalysis> getPlanAnalysises() {
        return planAnalysises;
    }

    public long getPlanId(){
        return prunedNetwork.getPlanId();
    }

    public CompetitiveDemandMapping getCompetitiveDemandMapping() {
        return prunedNetwork.getCompetitiveDemandMapping();
    }
}
