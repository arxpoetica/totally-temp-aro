package com.altvil.netop.recalc;

import org.springframework.web.bind.annotation.RestController;

@RestController
public class RecalcFtthFiberRoute {
/*
	@Autowired
	private RecalcService recalcService;

	@Autowired
	private FiberPlanner fiberPlanner;

	@RequestMapping(value = "/recalc/fiber-route", method = RequestMethod.POST)
	public @ResponseBody RecalcResponse<FiberRouteRecalculation> getFiberRoute(
			@RequestBody FiberRoutePlaningInputs inputs)
			throws JsonProcessingException {

		return recalcService
				.submit(() -> {
					PlanOptions planOptions = fiberPlanner.createPlanOptions(
							inputs.getServiceAreaId(),
							inputs.getDeploymentPlanId());

					DeploymentPlanRouter planRouter = fiberPlanner
							.createDeploymentPlanRouter(planOptions,
									inputs.getDeploymentDate());

					FiberRouteRecalculation result = new FiberRouteRecalculation();
					result.setFiberRoutePlaningInputs(inputs);

					result.setFiberRouteUpdates(inputs
							.getFiberPlanRequests()
							.stream()
							.map(fpr -> {
								PlanUpdates.ElementUpdate<FiberRoute, FiberRoutesEntity> elementUpdate = planRouter
										.planChildRoute(fpr.getEquipmentOid(),
												fpr.getCableType());

								if (elementUpdate == null) {
									return null;
								} else {
									FiberRoutesEntity entity = elementUpdate
											.getEntity();
									return new FiberRouteUpdate(entity.getId(),
											entity.getObjectId());
								}

							}).filter(fru -> fru != null)
							.collect(Collectors.toList()));

					return result;
				}).getResponse();

	}

	@RequestMapping(value = "/recalc/new-fiber-route", method = RequestMethod.POST)
	public @ResponseBody RecalcResponse<NewFiberRouteRecalculation> getNewFiberRoute(
			@RequestBody NewFiberRoutePlaningInputs inputs)
			throws JsonProcessingException {

		return recalcService.submit(() -> {
			
			FiberRoutePlanner planner = fiberPlanner
					.createRoutePlannerFactory(inputs.getServiceAreaId(), inputs.getDeploymentPlanId())
					.createFiberRoutePlanner(inputs.getDeploymentDate()) ;
			
			NewFiberRouteRecalculation result = new NewFiberRouteRecalculation();
			result.setNewFiberRoutePlaningInputs(inputs);
			
			Collection<FiberSourceRoute> fiberRoutes = planner.planEquipmentSourceRoutes(Collections.singleton(
					inputs.getSourceFiberRequest().getEquipmentOid()),
					inputs.getTargetOids()) ;
			
			AtomicLong counter = new AtomicLong() ;
			List<RawRoute> newRoutes = fiberRoutes.stream().map(fsr ->  new RawRoute(counter.getAndIncrement(), fsr.getAllEdges().stream()
						.map(e ->  new RawSegment(GeometryUtil.asMultiLineString(e.getValue().getLineString())))
						.collect(Collectors.toList()))).collect(Collectors.toList()) ;
			result.setFiberRouteUpdates(newRoutes);
			return result;
		}).getResponse();

	}
	*/
}
