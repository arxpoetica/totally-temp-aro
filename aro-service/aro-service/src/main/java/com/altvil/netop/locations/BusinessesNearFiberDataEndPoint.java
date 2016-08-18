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


}
