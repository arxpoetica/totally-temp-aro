package com.altvil.netop.newapi;

import org.springframework.web.bind.annotation.RestController;

@RestController
public class FiberRoutesRestService {
/*
	@Autowired
    FiberRouteService fiberRouteService;

    @RequestMapping(value = "/fiberRoutes", produces = "application/json", method = RequestMethod.GET)
    @ResponseBody
    public List<FiberRoutesEntity> getFiberRoute(@RequestBody Collection<Long> ids) {
        return fiberRouteService.getFiberRoute(ids);
    }

    @RequestMapping(value = "/fiberRoutes/getByServiceAreas/currentPlanId/{planId}", produces = "application/json", method = RequestMethod.GET)
    @ResponseBody
    public List<FiberRoutesEntity> getPlanEquipmentNodes(@RequestBody List<Integer> serviceAreaIds, @PathVariable("planId") int planId) {
        return fiberRouteService.getPlanFiberRoutes(serviceAreaIds, planId);
    }

    @RequestMapping(value = "/fiberRoutes/assureInPlan/{planId}", produces = "application/json", method = RequestMethod.GET)
    @ResponseBody
    public Map<Long, Long> assureFiberRoutesInPlan(@RequestBody List<Long> ids, @PathVariable("planId") int planId) {
        return fiberRouteService.assureFiberRoutesInPlan(ids, planId);
    }
    @RequestMapping(value = "/fiberRoutes/currentPlanId/{planId}", produces = "application/json", method = RequestMethod.POST)
    @ResponseBody
    public List<FiberRoutesEntity> updateFiberRoutes(@RequestBody List<FiberRoutesEntity> routesEntities, @PathVariable("planId") int planId) {
        return fiberRouteService.updateFiberRoutes(routesEntities, planId);
    }

    @RequestMapping(value = "/fiberRoutes/currentPlanId/{planId}", produces = "application/json", method = RequestMethod.DELETE)
    @ResponseBody
    public void delete(@RequestBody List<Long> ids, @PathVariable("planId") int planId) {
        fiberRouteService.delete(ids, planId);
    }
    */

}
