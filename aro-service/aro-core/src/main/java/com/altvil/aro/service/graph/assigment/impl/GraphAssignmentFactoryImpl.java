package com.altvil.aro.service.graph.assigment.impl;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphAssignmentFactory;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.vividsolutions.jts.geom.Point;

public class GraphAssignmentFactoryImpl implements GraphAssignmentFactory {

	public static final GraphAssignmentFactoryImpl FACTORY = new GraphAssignmentFactoryImpl();

	@Override
	public GraphEdgeAssignment createEdgeAssignment(PinnedLocation pl,
			AroEntity aroEntity) {

		return new GraphEdgeAssignmentImpl(aroEntity, pl);

	}

	public GraphEdgeAssignment debugGreateEdgeAssignment(PinnedLocation pl,
			AroEntity aroEntity) {
		return new GraphEdgeAssignmentImpl(aroEntity, pl);
	}

	private abstract static class AbstractGraphAssigment implements
			GraphAssignment {

		private AroEntity aroEntity;

		public AbstractGraphAssigment(AroEntity aroEntity) {
			super();
			this.aroEntity = aroEntity;

			if (this.aroEntity == null) {
				throw new NullPointerException();
			}
		}

		@Override
		public AroEntity getAroEntity() {
			return aroEntity;
		}

		public String toString() {
			return new ToStringBuilder(this).append("aroEntity", aroEntity).toString();

	}
	}

	private static class GraphEdgeAssignmentImpl extends AbstractGraphAssigment
			implements GraphEdgeAssignment {

		private PinnedLocation pinnedLocation;

		public GraphEdgeAssignmentImpl(AroEntity aroEntity,
				PinnedLocation pinnedLocation) {
			super(aroEntity);
			this.pinnedLocation = pinnedLocation;
			if( pinnedLocation == null ) {
				throw new NullPointerException() ;
			}
		}

		@Override
		public PinnedLocation getPinnedLocation() {
			return pinnedLocation;
		}

		@Override
		public GeoSegment getGeoSegment() {
			return pinnedLocation.getGeoSegment();
		}

		@Override
		public Point getPoint() {
			return pinnedLocation.getIntersectionPoint();
		}

		public String toString() {
			return new ToStringBuilder(this).append("pinnedLocation", pinnedLocation).appendSuper(super.toString()).toString();
		}

	}

}
