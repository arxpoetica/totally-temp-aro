package com.altvil.aro.service.processing;

import com.altvil.aro.model.ServiceLayer;

import java.io.Reader;
import java.io.Writer;
import java.util.Collection;

public interface UserProcessingLayerService {

    Collection<ServiceLayer> getUserServiceLayers(int userId) ;
    ServiceLayer getUserServiceLayers(int userId, int id) ;

    ServiceLayer addUserServiceLayer(Long userId, String layerName, String layerDescription);

    void loadUserServiceLayerEntitiesCSV(int id, Writer responseWriter);

    void saveUserServiceLayerEntitiesCSV(int id, Reader reader);
}
