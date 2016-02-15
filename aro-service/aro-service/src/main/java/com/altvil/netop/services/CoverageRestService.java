package com.altvil.netop.services;

import org.springframework.web.bind.annotation.RestController;

/**
 * Created by kwysocki on 05.11.15.
 */

@RestController
public class CoverageRestService {
/*
    @Autowired
    CoverageController coverageController;


    @ApiOperation(value = "Calculates coverage",
            notes = "Returns coverage inputs id"
    )
    @RequestMapping(value = "/coverage", produces = "application/json", method = RequestMethod.POST)
    public
    @ResponseBody
    Integer calculateCoverage(@RequestBody CoverageInputs coverageInputs) throws InterruptedException {
        if (coverageInputs.getGeographyType().equals(GeographyType.SERVICE_AREA.getValue())) {
            coverageInputs.setResultsToSave("service_area,deployment,location");
        } else {
            coverageInputs.setResultsToSave("service_area,deployment");
        }
        return coverageController.calculateCoverage(coverageInputs);
    }

    @RequestMapping(value = "/coverage/progress/{coverageInputsId}", produces = "application/json", method = RequestMethod.GET)
    @ResponseBody
    ProgressResponse getCoverageProgress(@PathVariable("coverageInputsId") Integer coverageInputsId) {
        return coverageController.getProgress(coverageInputsId);
    }


    @RequestMapping(value = "/coverage/cancel/{coverageInputsId}", produces = "application/json", method = RequestMethod.GET)
    @ResponseBody
    ProgressResponse cancelCoverageCalc(@PathVariable("coverageInputsId") Integer coverageInputsId) {
        return coverageController.cancel(coverageInputsId);
    }
    */

}


