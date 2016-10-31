package com.altvil.test.processing;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.List;

import com.altvil.aro.persistence.repository.user_data.LocationClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.service.processing.UserProcessingLayerService;
import com.altvil.aro.service.user.data.UserProcessingLayerServiceImpl;
import com.altvil.utils.csv.CsvReaderWriter;
import com.altvil.utils.csv.CsvReaderWriterFactory;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(value = "/test-config.xml")
@Transactional
public class UserProcessingLayerServiceTest {

    @Autowired
    UserProcessingLayerService layerService;

    String csvData ="entityCategoryId,lat,longitude\n" +
            "1,47.0529584,-122.4769104\n"+
                    "1,47.0429584,-122.4769104\n"+
                    "1,47.0429584,-122.4869104\n";
    private LocationClass locationClass = LocationClass.PRODUCER;

    @Test
    public void testCSVsave() throws IOException {

        ServiceLayer serviceLayer = layerService.addUserServiceLayer(6, "loadTestLayer", "loadTestLayer description");


        BufferedReader reader = new BufferedReader(new StringReader(csvData));

        layerService.saveUserServiceLayerEntitiesCSV(serviceLayer.getId(), reader, locationClass);
        ServiceLayer modifiedLayer = layerService.getUserServiceLayers(6, serviceLayer.getId());

        System.out.println(modifiedLayer);

    }

    @Test
    public void testGenerateAreas() throws IOException {

        ServiceLayer serviceLayer = layerService.addUserServiceLayer(6, "loadTestLayer", "loadTestLayer description");


        StringReader reader = new StringReader(csvData);

        layerService.saveUserServiceLayerEntitiesCSV(serviceLayer.getId(), reader, locationClass);
        ServiceLayer modifiedLayer = layerService.getUserServiceLayers(6, serviceLayer.getId());

        layerService.createAreasFromPoints(serviceLayer.getId(), 100000);
        System.out.println(modifiedLayer);

    }

    @Test
    public void testCSVload() throws IOException {

        ServiceLayer serviceLayer = layerService.addUserServiceLayer(6, "loadTestLayer", "loadTestLayer description");


        StringReader reader = new StringReader(csvData);

        layerService.saveUserServiceLayerEntitiesCSV(serviceLayer.getId(), reader, locationClass);
        StringWriter responseWriter = new StringWriter(1000);
        layerService.loadUserServiceLayerEntitiesCSV(serviceLayer.getId(), responseWriter);
        String response = responseWriter.toString();
        System.out.println(response);
    }
}
