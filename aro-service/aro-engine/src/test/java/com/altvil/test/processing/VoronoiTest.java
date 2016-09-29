package com.altvil.test.processing;

import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.service.processing.UserProcessingLayerService;
import com.altvil.aro.service.processing.impl.UserProcessingLayerServiceImpl;
import com.altvil.aro.service.processing.impl.VoronoiPolygonsGenerator;
import com.altvil.utils.GeometryUtil;
import com.altvil.utils.csv.CsvReaderWriter;
import com.altvil.utils.csv.CsvReaderWriterFactory;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.geom.Polygon;
import com.vividsolutions.jts.triangulate.VoronoiDiagramBuilder;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(value = "/test-config.xml")
public class VoronoiTest {


    String threePoints =
            "47.0529584,-122.4769104\n"+
                    "47.0429584,-122.4769104\n"+
                    "47.0429584,-122.4869104\n";


    String onePoint =
            "47.0529584,-122.4769104";




    @Test
    public void testVoronoi() throws IOException {
        VoronoiPolygonsGenerator generator = new VoronoiPolygonsGenerator(10000);
        Collection<Polygon> output = generator.generatePolygons(createPoints(threePoints));

        assertEquals(3, output.size());
    }


    @Test
    public void testVoronoiOnePoint() throws IOException {
        VoronoiPolygonsGenerator generator = new VoronoiPolygonsGenerator(10000);
        Collection<Polygon> output = generator.generatePolygons(createPoints(onePoint));

        assertEquals(1, output.size());
    }

    @Test
    public void testVoronoiZeroPoints() throws IOException {
        VoronoiPolygonsGenerator generator = new VoronoiPolygonsGenerator(10000);
        Collection<Polygon> output = generator.generatePolygons(Collections.emptyList());

        assertEquals(0, output.size());
    }


    Collection<Point> createPoints(String str){
        return Arrays.stream(str.split("\n"))
                .map(line -> {
                            String[] splitted = line.split(",");
                            return GeometryUtil.asPoint(new Coordinate(Double.parseDouble(splitted[1]), Double.parseDouble(splitted[0])));
                        }
                ).collect(Collectors.toList());
    }
}
