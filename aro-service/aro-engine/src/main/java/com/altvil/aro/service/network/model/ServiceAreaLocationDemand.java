package com.altvil.aro.service.network.model;

import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;

import java.io.Serializable;
import java.util.Map;

public class ServiceAreaLocationDemand implements Serializable{
    Map<Long, CompetitiveLocationDemandMapping> demandMapping;

    public ServiceAreaLocationDemand(Map<Long, CompetitiveLocationDemandMapping> demandMapping) {
        this.demandMapping = demandMapping;
    }

    public Map<Long, CompetitiveLocationDemandMapping> getDemandMapping() {
        return demandMapping;
    }
}

