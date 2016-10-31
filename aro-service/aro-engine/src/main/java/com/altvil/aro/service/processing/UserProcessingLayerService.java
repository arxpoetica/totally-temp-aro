package com.altvil.aro.service.processing;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.Reader;
import java.io.Writer;
import java.util.Collection;

import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.persistence.repository.user_data.LocationClass;

public interface UserProcessingLayerService {

    Collection<ServiceLayer> getUserServiceLayers(int userId) ;
    ServiceLayer getUserServiceLayers(int userId, int id) ;

    ServiceLayer addUserServiceLayer(int userId, String layerName, String layerDescription);

    void loadUserServiceLayerEntitiesCSV(int id, Writer responseWriter);

    void saveUserServiceLayerEntitiesCSV(int id, Reader reader, LocationClass locationClass) throws IOException;
    void saveUserServiceLayerEntitiesCSV(int id, BufferedReader reader, LocationClass locationClass) throws IOException;

    
    
    /**
     *
     * @return number of areas generated
     */
    int createAreasFromPoints(int id, double maxDistanceMeters);
    void updateServiceArea(int serviceLayerId) ;
    void updateCellTowers(int serviceLayerId) ;
    
}
