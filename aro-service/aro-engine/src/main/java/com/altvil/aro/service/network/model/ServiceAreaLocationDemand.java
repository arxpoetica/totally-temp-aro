package com.altvil.aro.service.network.model;

import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.aro.service.entity.LocationEntityType;

import java.io.Serializable;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class ServiceAreaLocationDemand implements Serializable{
    Map<Long, CompetitiveLocationDemandMapping> demandMapping;

    private ServiceAreaLocationDemand() {
    }

    public static ServiceAreaLocationDemandBuilder build(){
        return new ServiceAreaLocationDemandBuilder();
    }
    public Map<Long, CompetitiveLocationDemandMapping> getDemandMapping() {
        return demandMapping;
    }


    public static class ServiceAreaLocationDemandBuilder{
        ServiceAreaLocationDemand demand = new ServiceAreaLocationDemand();

        private ServiceAreaLocationDemandBuilder() {
        }

        public ServiceAreaLocationDemandBuilder setMapping(Map<Long, CompetitiveLocationDemandMapping> mapping){
            demand.demandMapping = mapping;
            return this;
        }

        public ServiceAreaLocationDemandBuilder filterBySelectedTypes(Set<LocationEntityType> selectedTypes){
            demand.demandMapping = demand.demandMapping.entrySet()
                    .stream()
                    .filter(entry-> ! entry.getValue().getMatchingMappings(selectedTypes).isEmpty())
                    .collect(Collectors.toMap(Map.Entry::getKey, entry2 -> {
                        CompetitiveLocationDemandMapping value = entry2.getValue();
                        return new CompetitiveLocationDemandMapping(value.getBlockId(), value.getCompetitiveStrength(), value.getMatchingMappings(selectedTypes));
                    }))
            ;
            return this;
        }

        public ServiceAreaLocationDemand build(){
            return demand;
        }

    }
}

