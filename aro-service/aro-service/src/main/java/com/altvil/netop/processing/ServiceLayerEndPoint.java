package com.altvil.netop.processing;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.Writer;
import java.util.List;

@RestController
public class ServiceLayerEndPoint {

    @RequestMapping(value = "/serviceLayers", method = RequestMethod.GET)
    public List<AroServiceLayer> getServiceLayers(){
        return null;
    }

    @RequestMapping(value = "/serviceLayers/{id}", method = RequestMethod.GET)
    public AroServiceLayer getServiceLayers(@PathVariable int id){
        return null;
    }


    @RequestMapping(value = "/serviceLayers", method = RequestMethod.POST)
    public AroServiceLayer processCommand(@RequestBody AddLayerRequest request){
        return null;
    }


    @RequestMapping(value = "/serviceLayers/{id}", method = RequestMethod.DELETE)
    public void deleteServiceLayer(@PathVariable int id){

    }


    @RequestMapping(value = "/serviceLayers/{id}/entities.csv", method = RequestMethod.GET, produces = "text/csv")
    public void getServiceLayerEntitesCSV(@PathVariable int id, Writer responseWriter){

    }



    @RequestMapping(value="/serviceLayers/{id}/entities.csv", method=RequestMethod.POST)
    public void handleFileUpload(
            @PathVariable int id,
            @RequestParam("file") MultipartFile file) {

        if (!file.isEmpty()) {
            try {
                file.getInputStream();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
    }

    @RequestMapping(value = "/serviceLayers/{id}/command", method = RequestMethod.POST)
    public CommandStatusResponse processCommand(@RequestBody ServiceLayerCommand command){
        return null;
    }



}
