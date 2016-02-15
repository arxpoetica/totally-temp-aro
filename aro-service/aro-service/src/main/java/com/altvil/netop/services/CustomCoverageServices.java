package com.altvil.netop.services;

import org.springframework.web.bind.annotation.RestController;

@RestController
public class CustomCoverageServices {
/*
	private static final Logger logger = Logger.getLogger("CoverageLog");

	@Autowired
	ServiceAreaPlant serviceAreaPlant;

	@Autowired
	DeploymentPlanLoaderOld dpl;
	
	@Autowired
	ModelFactory modelFactory ;
	
    @Autowired
    DslamAnalysisController coverageAnalysisController;
    @Autowired
    private ProcessingSqlSession sqlSession;

    public CustomCoverageServices() {

	}


    @RequestMapping(value = "/closestEqNode", produces = "application/json", method = RequestMethod.POST)
    public @ResponseBody EquipmentNodeWithDistanceResponse getClosestEquipmentNodeWithDistance(@RequestBody ClosestEqNodeParams params) throws ParseException{
		int serviceAreaId = params.getServiceAreaId();
		ServiceArea serviceArea = serviceAreaPlant.getServiceArea(serviceAreaId);
		
		GraphPoint targetPoint = transformToGraphPoint(params.getLongitude(), params.getLatitude(), serviceArea);
		if(targetPoint == null)
			return null;
		
		int deploymentPlanId = params.getDeploymentPlanId();
		ServiceAreaDeploymentPlan deploymentPlan = new ServiceAreaDeploymentPlan(deploymentPlanId, serviceArea);
		Int2ObjectOpenHashMap<ServiceAreaDeploymentPlan> deploymentPlans = new Int2ObjectOpenHashMap<ServiceAreaDeploymentPlan>();
		deploymentPlans.put(serviceAreaId, deploymentPlan);
		IntArrayList serviceAreaIds = new IntArrayList();
		serviceAreaIds.add(serviceAreaId);
		String deploymentDateStr = params.getDeploymentDate();
		SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
		Date deploymentDate = dateFormat.parse(deploymentDateStr);

		Int2ObjectOpenHashMap<EquipmentNode> equipmentNodes = dpl.readEquipmentNodes(deploymentPlans, serviceAreaIds, deploymentPlanId, null, deploymentDate);
		Tracer tracer = new Tracer(serviceArea.getRoadGraph(), params.isUseDirectionalGraph());
		
		EquipmentNodeWithDistance tracerResult = tracer.getPointClosestEquipmentNodeWithDistance(equipmentNodes.values(), targetPoint);
		EquipmentNodeWithDistanceResponse response= new EquipmentNodeWithDistanceResponse();
		response.setDistance(tracerResult.getDistance()*0.3048);
		response.setEquipmentNodeId(tracerResult.getEquipmentNode().getId());
		return response;
	}
	
	
	@RequestMapping(value="/customDeploymentCoverage", produces="application/json", method = RequestMethod.POST)
	public @ResponseBody Map<Integer, Double> getCustomDeploymentCoverage(@RequestBody CustomDeploymentCoverageParams params) throws ParseException{
		int serviceAreaId = params.getServiceAreaId();
		ServiceArea serviceArea = serviceAreaPlant.getServiceArea(serviceAreaId);
		
		GraphPoint targetPoint = transformToGraphPoint(params.getLongitude(), params.getLatitude(), serviceArea);
		if(targetPoint == null)
			return null;
		
		AnalysisContext analysisContext = new AnalysisContext(sqlSession);

        CoverageInputs coverageInputs = params.getCoverageInputs();
		DslamCoverageOptions coverageOptions = new DslamCoverageOptionsImpl(coverageInputs);
		DeploymentPlanLoaderOld dpl = new DeploymentPlanLoaderOld(sqlSession, modelFactory);


		DeploymentPlan deploymentPlan = dpl.loadDeploymentPlan(coverageOptions, false, analysisContext);
		ServiceAreaDeploymentPlan serviceAreaDeploymentPlan = deploymentPlan.getServiceAreaDeployments(serviceArea);
		
		Deployment deployment = createTestedDeployment(params, serviceArea,
				targetPoint, analysisContext, coverageInputs, coverageOptions);
		serviceAreaDeploymentPlan.addEquipmentNode(deployment.getEquipmentNode());
		serviceAreaDeploymentPlan.addCoverageDeployment(deployment);
		
		BroadbandCoverageCalculator calculator = new BroadbandCoverageCalculator(
				serviceAreaDeploymentPlan.getServiceArea(),
				coverageOptions, analysisContext,
				serviceAreaDeploymentPlan.getStaticLocationEquipmentNodesMap(),
				serviceAreaDeploymentPlan.getStaticRoadSegmentsEquipmentNodesMap());
		BroadbandCoverage broadbandCoverage;
		try {
			broadbandCoverage = calculator
					.calculateCoverage(serviceAreaDeploymentPlan);

		} catch (UnknownLocationDataSource e) {
			logger.error("", e);
			throw new RuntimeException(e);
		}
		ObjectCoverage depObjectCoverage = broadbandCoverage.getDeploymentCoverage(deployment);
		Map<Integer, Double> result = new HashMap<Integer, Double>();
		for (Product product : depObjectCoverage.getProducts()) {

			double coverage = depObjectCoverage.getCoverage(product);
			result.put(product.getBandwidth(), coverage);
		}
		
		return result;
	}

	private Deployment createTestedDeployment(
			CustomDeploymentCoverageParams params, ServiceArea serviceArea,
			GraphPoint targetPoint, AnalysisContext analysisContext,
            CoverageInputs coverageInputs, DslamCoverageOptions coverageOptions) {
        Date deploymentDate = new Date();
        EquipmentNode eqNode = 
        		modelFactory.createEquipmentModel().modify(-1L, serviceArea, deploymentDate, targetPoint, false,
        				new HashMap<String, String>(), null, 2, coverageOptions.getDeploymentPlanId()).assemble() ;		
        		//new EquipmentNode(-1L, serviceArea, deploymentDate, targetPoint, false, new HashMap<String, String>(), null, 2, coverageOptions.getDeploymentPlanId());
		Technology technology = analysisContext.getTechnology(params.getTechnologyId());
		RateReachMatrix rrMatrix = analysisContext.getRateReachMatrix(coverageInputs.getDistanceThresholdGroupId(), coverageOptions.getEntityTypes().iterator().next());
		SpeedThresholds thresholds = new SpeedThresholds();
		thresholds.extendRangeIfLower(rrMatrix.getSpeedThresholds(technology),Integer.MAX_VALUE);
		
		Set<Technology> capableTechnologies = Collections.emptySet();
		Deployment deployment = new Deployment(-1l, eqNode, technology, capableTechnologies, deploymentDate, thresholds, Integer.MAX_VALUE, new HashMap<String, String>(), true);
		deployment.setSubjectToSiteBoundaries(false);
		eqNode.addDeployment(deployment);
		return deployment;
	}
	
	private GraphPoint transformToGraphPoint(double logitude, double latitude, ServiceArea serviceArea) {
		try{
			HashMap<String, Object> queryParameters = new HashMap<String, Object>();
			queryParameters.put("serviceAreaId", serviceArea.getId());
			queryParameters.put("logitude", logitude);
			queryParameters.put("latitude", latitude);
			Map<Object,Object> result = sqlSession.selectMap("selectPointNearbySegments", queryParameters, "point_id");
			@SuppressWarnings("unchecked")
			Map<String,Object> record = (Map<String,Object>) result.get(1);
			if(record == null)
				return null;
			Integer roadSegmentId = (Integer) record.get("road_segment_id");
			Double distanceToSegmentStart = ((double) record.get("distance_to_segement_start"))/0.3048;
			Double distanceToSegmentEnd = ((double) record.get("distance_to_segement_end")) /0.3048;
			PGobject pgClosestSegmentPoint = ((PGobject) record.get("closest_segment_point"));
			GeoLocation closestPoint = PGUtils.getGeoLocation(pgClosestSegmentPoint);
			RoadSegment rs = serviceArea.getRoadGraph().getRoadSegment(roadSegmentId);
			GeoLocation coordinates = new GeoLocation(logitude, latitude);
			GraphPoint graphPoint = new GraphPoint(rs, distanceToSegmentStart, distanceToSegmentEnd, coordinates, closestPoint);
			
			return graphPoint;
		}finally{
			sqlSession.close();
		}
	}
	*/
	
}
