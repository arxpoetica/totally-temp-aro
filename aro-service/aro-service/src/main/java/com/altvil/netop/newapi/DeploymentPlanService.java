package com.altvil.netop.newapi;

import org.springframework.web.bind.annotation.RestController;

/**
 * Created by E535 on 2016-02-03.
 */
@RestController
public class DeploymentPlanService {
/*
    @Autowired
    EquipmentNodeService equipmentNodeService;

    @Autowired
    FiberRouteService fiberRouteService;

    @Transactional
    @RequestMapping(value = "/clearPlan", produces = "application/json", method = RequestMethod.POST)

    void clearPlan(@RequestBody DeleteRequest request){
        List<EquipmentNodeEntity> nodes = equipmentNodeService.getPlanEquipmentNodes(request.getServiceAreaIds(), request.getDeploymentPlanId());
        Set<EquipmentNodeEntity> nodesToRemove = nodes.stream().filter(node -> !node.getDeploymentDate().before(request.getDeploymentDate())).collect(Collectors.toSet());

        Stream<EquipmentDeploymentsEntity> deploymentsToRemove = nodes.stream()
                .filter(node -> !nodesToRemove.contains(node))
                .flatMap(node -> node.getEquipmentDeployments().stream())
                .filter(deployment -> !deployment.getDeploymentDate().before(request.getDeploymentDate()));

        List<EquipmentNodeEntity> nodesToUpdate = deploymentsToRemove.peek(deployment -> deployment.getEquipmentNode().getEquipmentDeployments().remove(deployment))
                .map(EquipmentDeploymentsEntity::getEquipmentNode).collect(Collectors.toList());

        equipmentNodeService.delete2(nodesToRemove, request.getDeploymentPlanId());
        equipmentNodeService.updateEquipmentNodes(nodesToUpdate, request.getDeploymentPlanId());


        List<FiberRoutesEntity> routes = fiberRouteService.getPlanFiberRoutes(request.getServiceAreaIds(), request.getDeploymentPlanId());
        Set<FiberRoutesEntity> routesToRemove = routes.stream()
                .filter(route -> !route.getDeploymentDate().before(request.getDeploymentDate()))
                .collect(Collectors.toSet());
        fiberRouteService.delete(request.getDeploymentPlanId(), routesToRemove);

    }
    */
}
