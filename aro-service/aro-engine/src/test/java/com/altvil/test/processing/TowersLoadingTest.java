package com.altvil.test.processing;

import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.persistence.repository.user_data.LocationClass;
import com.altvil.aro.service.processing.UserProcessingLayerService;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(value = "/test-config.xml")
@Transactional
public class TowersLoadingTest {

    @Autowired
    UserProcessingLayerService layerService;

    String csvData ="entity_category_id,lat,longitude,foobar\n" +
            "5,47.55,-122.22,tfrdc\n" +
            "5,47.56,-122.22,ciwhb\n";

    private LocationClass locationClass = LocationClass.consumer;

    @Test
    public void testCSVsave() throws IOException {

        ServiceLayer serviceLayer = layerService.addUserServiceLayer(6, "loadTestLayer1234567", "loadTestLayer description");


        BufferedReader reader = new BufferedReader(new StringReader(csvData));

        layerService.saveUserServiceLayerEntitiesCSV(serviceLayer.getId(), reader, locationClass);
        layerService.updateCellTowers(serviceLayer.getId());
        ServiceLayer modifiedLayer = layerService.getUserServiceLayers(6, serviceLayer.getId());

        System.out.println(modifiedLayer);

    }


}
