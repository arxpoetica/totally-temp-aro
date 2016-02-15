package com.altvil.netop.demand.heatmap;

import org.springframework.web.bind.annotation.RestController;

@RestController
public class DemandForHeatmapService {
	
	/*

    @Autowired
    LocationsSpendsCalculator locationsSpendsCalculator;

    @RequestMapping(value = "/financials/heatmap", method = RequestMethod.POST)
    public List<LocationSpendResponse> getLocationSpendsForHeatmap(@RequestBody FinancialInputs financialInputs) {
        return locationsSpendsCalculator.
                getLocationSpends(financialInputs).
                map(this::createSpendResponse)
                .collect(toList());
    }

    private LocationSpendResponse createSpendResponse(LocationSpend locationSpend) {

        Location location = locationSpend.getLocation();
        GeoLocation coordinates = location.getCoordinates();
        return new LocationSpendResponse(coordinates.getX(), coordinates.getY(), location.getId(), locationSpend.getSpend());
    }
    
    */
}
