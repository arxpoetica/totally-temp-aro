package com.altvil.aro.service.graph.builder;


public class RoadLocationBuilder {

	/*
	private static final Logger log = LoggerFactory
			.getLogger(RoadLocationBuilder.class.getName());
	private GraphModelBuilder<GeoSegment> graphModelBuilder;
	private GraphNodeFactory vertexFactory;

	// private Map<Long, List<LocationInterface>> roadLocationsByGid = new
	// HashMap<>();
	private Map<Long, List<RoadLocation>> roadLocationsByTlid = new HashMap<>();

	private EquipmentLocation centralOffice;
	private GraphNode spliceVertex;
	private int edgesIn = 0;
	private int edgesOut = 0;
	private int doubleCounted = 0;
	private boolean identifiedCo = false;
	private int totalLocations = 0;
	private int locationsLoaded = 0 ;

	private List<LocationEntityAssignment> EMPTY_LOCATIONS = Collections
			.emptyList();
	private Map<Long, GraphNode> roadVertexMap = new HashMap<>();

	private Set<Long> seenEdges = new HashSet<>();
	private Map<? extends RoadLocation, ? extends CoverageAggregateStatistic> roadLocationsProperties;

	private RoadLocationBuilder(GraphModelBuilder<GeoSegment> graphModelBuilder,
			GraphNodeFactory vertexFactory) {
		super();
		this.graphModelBuilder = graphModelBuilder;
		this.vertexFactory = vertexFactory;
	}

	public RoadLocationBuilder setRoadLocations(
			Collection<RoadLocation> roadLocations,
			Map<RoadLocation, CoverageAggregateStatistic> roadLocationsProperties) {
		// roadLocationsByGid = groupByGid(roadLocations);
		
		this.locationsLoaded =  roadLocations.size() ;
		if( log.isDebugEnabled() ) log.debug("Locations Loaded " + locationsLoaded) ;
		this.roadLocationsProperties = roadLocationsProperties;
		roadLocationsByTlid = groupByTlid(roadLocations);
		return this;
	}

	public RoadLocationBuilder setCentralOffice(EquipmentLocation co) {
		this.centralOffice = co;

		spliceVertex = vertexFactory.createGraphNode(co.getCoordinates());

		graphModelBuilder.setRoot(spliceVertex);

		return this;
	}

	private Map<Long, List<RoadLocation>> groupByTlid(
			Collection<? extends RoadLocation> locations) {
		return locations.stream()
				.filter(this::hasFiberDemand)
				.collect(groupingBy(GraphPoint::getTlid));
	}

	private boolean hasFiberDemand(RoadLocation roadLocation) {
		CoverageAggregateStatistic coverageAggregateStatistic = roadLocationsProperties.get(roadLocation);
		return coverageAggregateStatistic != null && coverageAggregateStatistic.getFiberDemand() > 0;

	}

	private GraphNode getRoadVertex(Long id, Point point) {
		GraphNode gn = roadVertexMap.get(id);

		if (gn == null) {
			roadVertexMap.put(id, gn = vertexFactory.createGraphNode(point));
		}

		return gn;

	}

	private GraphNode getLeftVertex(RoadEdge re) {
		return getRoadVertex(re.getTindf(),
				GeometryUtil.getStartPoint(re.getShape()));
	}

	private GraphNode getRightVertex(RoadEdge re) {
		return getRoadVertex(re.getTnidt(),
				GeometryUtil.getEndPoint(re.getShape()));
	}

	private List<LocationEntityAssignment> getOrderedLocationsByTlid(Long tlid) {
		List<RoadLocation> result = roadLocationsByTlid.get(tlid);

		if (result == null) {
			return EMPTY_LOCATIONS;
		}

		Collections.sort(result,
				(l1, l2) -> Double.compare(l1.getRoadSegmentPositionRatio(), l2.getRoadSegmentPositionRatio()));

		List<LocationEntityAssignment> locationAssignments = StreamUtil.map(
				result,
				l -> {
					AroRoadLocation location = new RoadLocationImpl(l
							.getLocationPoint(), l.getRoadSegmentPositionRatio(), l
							.getRoadSegmentClosestPoint(), l.getDistanceFromRoadSegmentInMeters());

					CoverageAggregateStatistic fiberCoverageStatistic = roadLocationsProperties.get(l);
					if (fiberCoverageStatistic != null) {
						LocationEntity le = EntityFactory.FACTORY.createLocationEntity(l.getId(), tlid, fiberCoverageStatistic);
						return new LocationEntityAssignment(le, location);
					}
					return null;

				});
		return StreamUtil.filter(locationAssignments, la -> la != null);
	}

	private GeoSegment createCoSegment(EquipmentLocation co) {

		LineString ls = GeometryUtil.createLineString(co.getCoordinates(),
				co.getRoadSegmentClosestPoint());
		return DefaultSegmentLocations.create(null, co.getDistanceFromRoadSegmentInMeters(), null, ls,
				EMPTY_LOCATIONS);
	}

	public RoadLocationBuilder add(RoadEdge re) {

		if (!seenEdges.add(re.getId())) {
			doubleCounted++;
			return this;
		}

		edgesIn++;

		List<LocationEntityAssignment> ordredLocations = getOrderedLocationsByTlid(re
				.getTlid());
		
		totalLocations += ordredLocations.size();

		GeoSegment sl = DefaultSegmentLocations.create(null, re.getLengthMeters(),
				re.getId(), re.getShape(), ordredLocations);

		GraphNode leftVertex = getLeftVertex(re);
		GraphNode rightVertex = getRightVertex(re);

		if ((re.getId() == centralOffice.getRoadSegmentId())) {

			identifiedCo = true;

			GeoSegment coSeg = createCoSegment(centralOffice);

			if (GeometryUtil.equalsRatio(centralOffice.getRoadSegmentPositionRatio(), 0)) {

				add(leftVertex, rightVertex, sl);
				graphModelBuilder.add(spliceVertex, leftVertex, coSeg,
						coSeg.getLength());

			} else if (GeometryUtil.equalsRatio(centralOffice.getRoadSegmentPositionRatio(), 1)) {
				add(leftVertex, rightVertex, sl);

				graphModelBuilder.add(spliceVertex, rightVertex, coSeg,
						coSeg.getLength());

			} else {

				GraphNode spliceRoadVertex = vertexFactory
						.createGraphNode(centralOffice.getRoadSegmentClosestPoint());

				graphModelBuilder.add(spliceVertex, spliceRoadVertex, coSeg,
						coSeg.getLength());

				List<GeoSegment> splits = sl.split(vertexFactory,
						centralOffice.getRoadSegmentPositionRatio());

				add(leftVertex, spliceRoadVertex, splits.get(0));
				add(spliceRoadVertex, rightVertex, splits.get(1));
			}

		} else if (re.getTindf() == re.getTnidt()) {

			PinnedLocation pl = sl.pinLocation(0.333);
			PinnedLocation p2 = sl.pinLocation(0.333 * 2);
			List<PinnedLocation> pins = new ArrayList<>();
			pins.add(pl);
			pins.add(p2);
			Collection<GeoSegment> splits = sl.split(vertexFactory, pins);
			Iterator<GeoSegment> splitsItr = splits.iterator();

			GraphNode point1 = vertexFactory.createGraphNode(pl
					.getIntersectionPoint());

			GraphNode point2 = vertexFactory.createGraphNode(pl
					.getIntersectionPoint());

			add(leftVertex, point1, splitsItr.next());
			add(point1, point2, splitsItr.next());
			add(point2, rightVertex, splitsItr.next());

		} else {
			add(leftVertex, rightVertex, sl);
		}

		return this;
	}

	private void add(GraphNode left, GraphNode right, GeoSegment sl) {

		graphModelBuilder.add(left, right, sl,
				sl.getLength());

		edgesOut++;

	}

	public GraphModel<GeoSegment> build() {

		if (!identifiedCo) {
			throw new AroException("Failed to identify CO for GID "
					+ centralOffice.getRoadSegmentId());
		}
		
		if( totalLocations != this.locationsLoaded) {
			log.warn("Missing Locations assigmnets " + locationsLoaded + " versus assigned " + totalLocations);
		}

		if (log.isDebugEnabled()) {
			log.debug("edgesIn  " + edgesIn);
			log.debug("edges out  " + edgesOut);
			log.debug("double counted  " + doubleCounted);
			log.debug("total locations  " + totalLocations);
		}

		GraphModel<GeoSegment> model = graphModelBuilder.build();
		// validate(model);
		return model;

	}
	*/

}
