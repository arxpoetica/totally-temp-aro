package com.altvil.netop.locations;


import com.altvil.netop.locations.model.BusinessDataByDistance;
import com.altvil.netop.locations.model.BusinessesReportRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.Writer;
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

    @RequestMapping(value = "/businesses", method = RequestMethod.POST)
    @ResponseStatus(value = HttpStatus.OK)
    public void businesses(@RequestBody BusinessesReportRequest request, Writer writer){
        try {
            writer.write(service.getBusinesses(request));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

}
