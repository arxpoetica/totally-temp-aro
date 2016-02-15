import java.io.IOException;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.transaction.TransactionConfiguration;

import com.altvil.netop.recalc.NewFiberRoutePlaningInputs;
import com.altvil.netop.recalc.RecalcFtthFiberRoute;
import com.fasterxml.jackson.databind.ObjectMapper;


@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(value = "/FTTHTest-context.xml")
@TransactionConfiguration(defaultRollback = true)
public class RoutePlanTest {
	

    @Autowired
    RecalcFtthFiberRoute recalcFtthFiberRoute;


    @Test
    public void testFtth() throws IOException {
        try {
            //fiber
           // String request = "{\"analysisMonths\":121,\"cableType\":\"FIBER_AERIAL\",\"demandInputs\":{\"analysisStartDate\":\"2016-03-01\",\"averageChurnRate\":0.025,\"competitorDataSource\":6,\"competitorSnapshotDate\":\"2013-06-01\",\"coverageInputs\":{\"analysisId\":21,\"coverageMethodology\":\"incremental\",\"deploymentDate\":\"2016-03-01\",\"deploymentPlanId\":2115,\"distanceThresholdGroupId\":1,\"entityType\":[1],\"distanceThresholdMeters\":\"152.4\",\"fiberCoverageTypeEnum\":\"distribution_fiber_distance_based\",\"geographyId\":2042,\"geographyType\":\"service_area\",\"graphSource\":\"roads\",\"locationDataDate\":\"2014-10-01\",\"locationDataSource\":2,\"maxLatency\":0,\"requestDate\":\"2016-02-02T14:02:43.547Z\",\"resultsToSave\":\"service_area,deployment,segment,location\",\"technologyId\":null,\"useBestTechnology\":true,\"useMaxSpeed\":false,\"useOnlyActive\":true,\"useSiteBoundaries\":false,\"userId\":29,\"versionChecksum\":6},\"productChurnRates\":{\"41\":0.045,\"42\":0.1,\"43\":0.04,\"44\":0.02,\"45\":0.065,\"46\":0.06,\"47\":0.02,\"48\":0.075,\"49\":0.025,\"50\":0.02,\"51\":0.05,\"52\":0.01,\"54\":0.01},\"productStrenghts\":{\"41\":4,\"42\":1,\"43\":4,\"44\":5,\"45\":2,\"46\":3,\"47\":6,\"48\":1,\"49\":4,\"50\":4,\"51\":3,\"52\":10,\"54\":10},\"providerTypes\":[3,4,5]},\"discountRate\":0.08,\"dslamOptimizationOptions\":{\"optimizationSpeed\":101,\"optimizationTechnologies\":[],\"radiusSearchSpaceForUpdate\":750,\"searchSpaceRecalculationMethod\":1},\"optimizationLimit\":1000,\"optimizationNetworkType\":\"FTTH\",\"optimizationTarget\":0.95,\"optimizationType\":\"CAPEX\",\"productsSpends\":{\"41\":40,\"42\":20,\"43\":45,\"44\":60,\"45\":25,\"46\":30,\"47\":65,\"48\":25,\"49\":50,\"50\":55,\"51\":35,\"52\":75,\"54\":65}}";
            //DSLAM
            //String request = "{\"analysisMonths\":121,\"cableType\":\"FIBER_AERIAL\",\"demandInputs\":{\"analysisStartDate\":\"2016-03-01\",\"averageChurnRate\":0.025,\"competitorDataSource\":6,\"competitorSnapshotDate\":\"2013-06-01\",\"coverageInputs\":{\"analysisId\":21,\"coverageMethodology\":\"incremental\",\"deploymentDate\":\"2016-03-01\",\"deploymentPlanId\":2165,\"distanceThresholdGroupId\":1,\"entityType\":[1],\"distanceThresholdMeters\":\"152.4\",\"fiberCoverageTypeEnum\":\"distribution_fiber_distance_based\",\"geographyId\":2042,\"geographyType\":\"service_area\",\"graphSource\":\"roads\",\"locationDataDate\":\"2014-10-01\",\"locationDataSource\":2,\"maxLatency\":0,\"requestDate\":\"2016-02-04T12:57:21.242Z\",\"resultsToSave\":\"service_area,deployment,segment,location\",\"technologyId\":null,\"useBestTechnology\":true,\"useMaxSpeed\":false,\"useOnlyActive\":true,\"useSiteBoundaries\":false,\"userId\":29,\"versionChecksum\":6},\"productChurnRates\":{\"41\":0.045,\"42\":0.1,\"43\":0.04,\"44\":0.02,\"45\":0.065,\"46\":0.06,\"47\":0.02,\"48\":0.075,\"49\":0.025,\"50\":0.02,\"51\":0.05,\"52\":0.01,\"54\":0.01},\"productStrenghts\":{\"41\":4,\"42\":1,\"43\":4,\"44\":5,\"45\":2,\"46\":3,\"47\":6,\"48\":1,\"49\":4,\"50\":4,\"51\":3,\"52\":10,\"54\":10},\"providerTypes\":[3,4,5]},\"discountRate\":0.08,\"dslamOptimizationOptions\":{\"optimizationSpeed\":\"12\",\"optimizationTechnologies\":[],\"radiusSearchSpaceForUpdate\":750,\"searchSpaceRecalculationMethod\":1},\"optimizationLimit\":1000000,\"optimizationNetworkType\":\"FTTN\",\"optimizationTarget\":0.95,\"optimizationType\":\"CAPEX\",\"productsSpends\":{\"41\":40,\"42\":20,\"43\":45,\"44\":60,\"45\":25,\"46\":30,\"47\":65,\"48\":25,\"49\":50,\"50\":55,\"51\":35,\"52\":75,\"54\":65}}";
            //Hybrid
           // String request = "{\"analysisMonths\":121,\"cableType\":\"FIBER_AERIAL\",\"demandInputs\":{\"analysisStartDate\":\"2016-03-01\",\"averageChurnRate\":0.025,\"competitorDataSource\":6,\"competitorSnapshotDate\":\"2013-06-01\",\"coverageInputs\":{\"analysisId\":21,\"coverageMethodology\":\"incremental\",\"deploymentDate\":\"2016-03-01\",\"deploymentPlanId\":2249,\"distanceThresholdGroupId\":1,\"entityType\":[1],\"distanceThresholdMeters\":\"152.4\",\"fiberCoverageTypeEnum\":\"distribution_fiber_distance_based\",\"geographyId\":\"2218\",\"geographyType\":\"service_area\",\"graphSource\":\"roads\",\"locationDataDate\":\"2014-10-01\",\"locationDataSource\":2,\"maxLatency\":0,\"requestDate\":\"2016-02-11T13:03:48.921Z\",\"resultsToSave\":\"service_area,deployment,segment,location\",\"technologyId\":null,\"useBestTechnology\":true,\"useMaxSpeed\":false,\"useOnlyActive\":true,\"useSiteBoundaries\":false,\"userId\":29,\"versionChecksum\":5317},\"productChurnRates\":{\"41\":0.045,\"42\":0.1,\"43\":0.04,\"44\":0.02,\"45\":0.065,\"46\":0.06,\"47\":0.02,\"48\":0.075,\"49\":0.025,\"50\":0.02,\"51\":0.05,\"52\":0.01,\"54\":0.01},\"productStrenghts\":{\"41\":4,\"42\":1,\"43\":4,\"44\":5,\"45\":2,\"46\":3,\"47\":6,\"48\":1,\"49\":4,\"50\":4,\"51\":3,\"52\":10,\"54\":10},\"providerTypes\":[3,4,5]},\"discountRate\":0.08,\"dslamOptimizationOptions\":{\"optimizationSpeed\":101,\"optimizationTagSets\":[],\"optimizationTechnologies\":[],\"radiusSearchSpaceForUpdate\":750,\"searchSpaceRecalculationMethod\":1},\"optimizationLimit\":1000000,\"optimizationNetworkType\":\"FTTH\",\"optimizationTarget\":0.95,\"optimizationType\":\"CAPEX\",\"productsSpends\":{\"41\":40,\"42\":20,\"43\":45,\"44\":60,\"45\":25,\"46\":30,\"47\":65,\"48\":25,\"49\":50,\"50\":55,\"51\":35,\"52\":75,\"54\":65}}";
            String request = "{\"deploymentDate\":\"2016-01-01\",\"deploymentPlanId\":2262,\"serviceAreaId\":642,\"sourceFiberRequest\":{\"equipmentOid\":686323},\"targetOids\":[683959,683951]}" ;

            //"{\"analysisMonths\":121,\"cableType\":\"FIBER_AERIAL\",\"demandInputs\":{\"analysisStartDate\":\"2016-03-01\",\"averageChurnRate\":0.025,\"competitorDataSource\":6,\"competitorSnapshotDate\":\"2013-06-01\",\"coverageInputs\":{\"analysisId\":21,\"coverageMethodology\":\"incremental\",\"deploymentDate\":\"2016-03-01\",\"deploymentPlanId\":2209,\"distanceThresholdGroupId\":1,\"entityType\":[1],\"distanceThresholdMeters\":\"152.4\",\"fiberCoverageTypeEnum\":\"distribution_fiber_distance_based\",\"geographyId\":2042,\"geographyType\":\"service_area\",\"graphSource\":\"roads\",\"locationDataDate\":\"2014-10-01\",\"locationDataSource\":2,\"maxLatency\":0,\"requestDate\":\"2016-02-09T16:39:24.079Z\",\"resultsToSave\":\"service_area,deployment,segment,location\",\"technologyId\":null,\"useBestTechnology\":true,\"useMaxSpeed\":false,\"useOnlyActive\":true,\"useSiteBoundaries\":false,\"userId\":29,\"versionChecksum\":6},\"productChurnRates\":{\"41\":0.045,\"42\":0.1,\"43\":0.04,\"44\":0.02,\"45\":0.065,\"46\":0.06,\"47\":0.02,\"48\":0.075,\"49\":0.025,\"50\":0.02,\"51\":0.05,\"52\":0.01,\"54\":0.01},\"productStrenghts\":{\"41\":4,\"42\":1,\"43\":4,\"44\":5,\"45\":2,\"46\":3,\"47\":6,\"48\":1,\"49\":4,\"50\":4,\"51\":3,\"52\":10,\"54\":10},\"providerTypes\":[3,4,5]},\"discountRate\":0.08,\"dslamOptimizationOptions\":{\"optimizationSpeed\":null,\"optimizationTagSets\":[],\"optimizationTechnologies\":[4],\"radiusSearchSpaceForUpdate\":750,\"searchSpaceRecalculationMethod\":1},\"optimizationLimit\":20000,\"optimizationNetworkType\":\"FTTN\",\"optimizationTarget\":500000,\"optimizationType\":\"IRR\",\"productsSpends\":{\"41\":40,\"42\":20,\"43\":45,\"44\":60,\"45\":25,\"46\":30,\"47\":65,\"48\":25,\"49\":50,\"50\":55,\"51\":35,\"52\":75,\"54\":65}}";

            ObjectMapper mapper = new ObjectMapper();
            NewFiberRoutePlaningInputs inputs = mapper.readValue(request, NewFiberRoutePlaningInputs.class);
           // RecalcResponse<NewFiberRouteRecalculation> response = recalcFtthFiberRoute.getNewFiberRoute(inputs);
            Thread.sleep(60 * 60 * 1000);
            //System.out.println(response);
        } catch (Throwable err) {
            err.printStackTrace();
        }
    }

}
