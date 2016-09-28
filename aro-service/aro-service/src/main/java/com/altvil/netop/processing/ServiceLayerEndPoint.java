package com.altvil.netop.processing;

import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.service.processing.UserProcessingLayerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.io.Writer;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toList;

@RestController
public class ServiceLayerEndPoint {

    @Autowired
    UserProcessingLayerService service;

    @RequestMapping(value = "/serviceLayers/{userId}", method = RequestMethod.GET)
    public List<AroServiceLayer> getServiceLayers(@PathVariable int userId){
        return service.getUserServiceLayers(userId)
                .stream()
                .map(AroServiceLayer::new)
                .collect(toList());

    }

    @RequestMapping(value = "/serviceLayers/{userId}/{id}", method = RequestMethod.GET)
    public AroServiceLayer getServiceLayers(@PathVariable int userId, @PathVariable int id){
        return new AroServiceLayer(service.getUserServiceLayers(userId, id));
    }


    @RequestMapping(value = "/serviceLayers", method = RequestMethod.POST)
    public AroServiceLayer processCommand(@RequestBody AddLayerRequest request){
        return new AroServiceLayer(service.addUserServiceLayer(request.getUserId(), request.getLayerName(), request.getLayerDescription()));
    }


    @RequestMapping(value = "/serviceLayers/{id}", method = RequestMethod.DELETE)
    public void deleteServiceLayer(@PathVariable int id){
        throw new UnsupportedOperationException();
    }


    @RequestMapping(value = "/serviceLayers/{id}/entities.csv", method = RequestMethod.GET, produces = "text/csv")
    public void getServiceLayerEntitesCSV(@PathVariable int id, Writer responseWriter){
        service.writeUserServiceLayerEntitiesCSV(id, responseWriter);
    }



    @RequestMapping(value="/serviceLayers/{id}/entities.csv", method=RequestMethod.POST)
    public void handleFileUpload(
            @PathVariable int id,
            @RequestParam("file") MultipartFile file) {

        if (!file.isEmpty()) {
            try(Reader reader = new InputStreamReader(file.getInputStream(), "UTF-8")){
                service.saveUserServiceLayerEntitiesCSV(id, reader);
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
