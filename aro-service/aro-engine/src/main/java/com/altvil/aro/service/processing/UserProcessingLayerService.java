package com.altvil.aro.service.processing;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.Writer;
import java.util.Collection;

import com.altvil.aro.model.ServiceLayer;

public interface UserProcessingLayerService {

    Collection<ServiceLayer> getUserServiceLayers(int userId) ;
    ServiceLayer getUserServiceLayers(int userId, int id) ;

    ServiceLayer addUserServiceLayer(int userId, String layerName, String layerDescription);

    void loadUserServiceLayerEntitiesCSV(int id, Writer responseWriter);

    void saveUserServiceLayerEntitiesCSV(int id, BufferedReader reader) throws IOException;

    /**
     *
     * @return number of areas generated
     */
    int createAreasFromPoints(int id, double maxDistanceMeters);
}
