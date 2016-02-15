import java.io.IOException;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.altvil.netop.services.CoverageRestService;
import com.fasterxml.jackson.databind.ObjectMapper;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(value = "/FTTHTest-context.xml")
public class CoverageTest {
 
	@Autowired
	private CoverageRestService coverageRestService ;

    @Test
    public void testCoverage() throws IOException {
    	
    	try {
    	String request = "{\"analysisId\":332,\"coverageMethodology\":\"incremental\",\"deploymentDate\":\"2026-02-01\",\"deploymentPlanId\":2191,\"distanceThresholdGroupId\":1,\"distanceThresholdMeters\":152.4,\"entityType\":[1],\"fiberCoverageTypeEnum\":\"distribution_fiber_distance_based\",\"geographyId\":642,\"geographyType\":\"service_area\",\"graphSource\":\"roads\",\"locationDataDate\":\"2014-01-01\",\"locationDataSource\":7,\"maxLatency\":null,\"requestDate\":\"2016-02-08T08:59:25.366Z\",\"resultsToSave\":\"service_area,deployment,location\",\"technologyId\":null,\"useBestTechnology\":true,\"useMaxSpeed\":false,\"useOnlyActive\":false,\"useSiteBoundaries\":false,\"userId\":27,\"versionChecksum\":6}";
        ObjectMapper mapper = new ObjectMapper();
      //  CoverageInputs inputs = mapper.readValue(request, CoverageInputs.class);
      //  coverageRestService.calculateCoverage(inputs) ;
        for( ;; ) { Thread.sleep(100000);  }
    	} catch(Throwable err ) {
    		err.printStackTrace(); 
    	}
    }


}
