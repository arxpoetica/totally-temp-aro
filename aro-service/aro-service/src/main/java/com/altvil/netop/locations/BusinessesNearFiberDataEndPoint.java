package com.altvil.netop.locations;


import com.altvil.netop.locations.model.BusinessDataByDistance;
import com.altvil.netop.locations.model.BusinessesReportRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class BusinessesNearFiberDataEndPoint {
    @Autowired
    BusinesessNearFiberReportService service;

    @RequestMapping(value = "/businesses/getTotals", method = RequestMethod.POST)
    public List<BusinessDataByDistance> getTotals(@RequestBody BusinessesReportRequest request){
        return service.getTotals(request);
    }

    @RequestMapping(value = "/businesses/getBuildingsCountsByBusinessesSizes", method = RequestMethod.POST)
    public List<BusinessDataByDistance> getBuildingsCountsByBusinessesSizes(@RequestBody BusinessesReportRequest request){
        return service.getBuildingsCountsByBusinessesSizes(request);
    }
    @RequestMapping(value = "/businesses/getBusinessesCountsBySizes", method = RequestMethod.POST)
    public List<BusinessDataByDistance> getBusinessesCountsBySizes(@RequestBody BusinessesReportRequest request){
        return service.getBusinessesCountsBySizes(request);
    }


}
