package com.altvil.aro.service.processing;

import java.util.Collection;
import java.util.Set;

import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.service.entity.LocationEntityType;

public interface ProcessingLayerService {

	Collection<ServiceLayer> getServiceLayers(Collection<Integer> serviceLayersIds) ;
	Collection<ServiceLayer> inferServiceLayers(Collection<LocationEntityType> locationEntityTypes) ;
	Set<LocationEntityType> getSupportedEntityTypes(ServiceLayer serviceLayer) ;



}
