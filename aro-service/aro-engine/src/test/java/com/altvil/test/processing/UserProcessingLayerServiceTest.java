package com.altvil.test.processing;

import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.service.processing.UserProcessingLayerService;
import com.altvil.aro.service.processing.impl.UserProcessingLayerServiceImpl;
import com.altvil.utils.csv.CsvReaderWriter;
import com.altvil.utils.csv.CsvReaderWriterFactory;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.List;

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

    @Test
    public void testCSVreader() throws IOException {

        CsvReaderWriter<UserProcessingLayerServiceImpl.EntityDataRow> csvReaderWriter = CsvReaderWriterFactory.FACTORY
                .create(UserProcessingLayerServiceImpl.EntityDataRow.class, "entityCategoryId","lat","longitude");
        List<UserProcessingLayerServiceImpl.EntityDataRow> parsed = csvReaderWriter.parse(new StringReader(csvData));
        System.out.println(parsed);
    }
    @Test
    public void testCSVsave() throws IOException {

        ServiceLayer serviceLayer = layerService.addUserServiceLayer(6, "loadTestLayer", "loadTestLayer description");


        StringReader reader = new StringReader(csvData);

        layerService.saveUserServiceLayerEntitiesCSV(serviceLayer.getId(), reader);
        ServiceLayer modifiedLayer = layerService.getUserServiceLayers(6, serviceLayer.getId());

        System.out.println(modifiedLayer);

    }

    @Test
    public void testGenerateAreas() throws IOException {

        ServiceLayer serviceLayer = layerService.addUserServiceLayer(6, "loadTestLayer", "loadTestLayer description");


        StringReader reader = new StringReader(csvData);

        layerService.saveUserServiceLayerEntitiesCSV(serviceLayer.getId(), reader);
        ServiceLayer modifiedLayer = layerService.getUserServiceLayers(6, serviceLayer.getId());

        int numOfAreas = layerService.createAreasFromPoints(serviceLayer.getId(), 100000);
        System.out.println(modifiedLayer);

    }

    @Test
    public void testCSVload() throws IOException {

        ServiceLayer serviceLayer = layerService.addUserServiceLayer(6, "loadTestLayer", "loadTestLayer description");


        StringReader reader = new StringReader(csvData);

        layerService.saveUserServiceLayerEntitiesCSV(serviceLayer.getId(), reader);
        StringWriter responseWriter = new StringWriter(1000);
        layerService.loadUserServiceLayerEntitiesCSV(serviceLayer.getId(), responseWriter);
        String response = responseWriter.toString();
        System.out.println(response);
    }
}
