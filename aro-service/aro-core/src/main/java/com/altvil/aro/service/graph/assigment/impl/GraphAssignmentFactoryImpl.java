package com.altvil.aro.service.graph.assigment.impl;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphAssignmentFactory;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.VertexAssignment;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.aro.service.graph.segment.transform.GeoSegmentTransform;
import com.altvil.aro.util.sequence.LongSequenceGenerator;
import com.altvil.aro.util.sequence.SequenceGenerator;
import com.vividsolutions.jts.geom.Point;

public class GraphAssignmentFactoryImpl implements GraphAssignmentFactory {

	public static final GraphAssignmentFactoryImpl FACTORY = new GraphAssignmentFactoryImpl();
	private static SequenceGenerator<Long> SEQUENCER = new LongSequenceGenerator();

	@Override
	public GraphEdgeAssignment createEdgeAssignment(PinnedLocation pl,
			AroEntity aroEntity) {

		return new GraphEdgeAssignmentImpl(SEQUENCER.next(), aroEntity, pl);

	}
	
	
	

	@Override
	public VertexAssignment createVertexAssignment(GraphNode vertex,
			AroEntity entity) {
		return new VertexAssignmentImpl(SEQUENCER.next(), entity, vertex);
	}




	public GraphEdgeAssignment debugGreateEdgeAssignment(PinnedLocation pl,
			AroEntity aroEntity) {
		return new GraphEdgeAssignmentImpl(SEQUENCER.next(), aroEntity, pl);
	}

	private abstract static class AbstractGraphAssigment implements
			GraphAssignment {

		private AroEntity aroEntity;
		private Long id;

		public AbstractGraphAssigment(Long id, AroEntity aroEntity) {
			super();
			this.id = id;
			this.aroEntity = aroEntity;

			if (this.aroEntity == null) {
				throw new NullPointerException();
			}
		}

		@Override
		public Long getId() {
			return id;
		}

		@Override
		public int hashCode() {
			return id.hashCode();
		}

		@Override
		public boolean equals(Object obj) {
			if (obj instanceof GraphAssignment) {
				return ((GraphAssignment) obj).getId().equals(id);
			}
			return false;
		}

		@Override
		public AroEntity getAroEntity() {
			return aroEntity;
		}

		public String toString() {
			return new ToStringBuilder(this).append("aroEntity", aroEntity)
					.toString();

		}
	}
	
	private static class VertexAssignmentImpl
		extends AbstractGraphAssigment
		implements VertexAssignment {

		private GraphNode vertex ;
		
		public VertexAssignmentImpl(Long id, AroEntity aroEntity,
				GraphNode vertex) {
			super(id, aroEntity);
			this.vertex = vertex;
		}

		@Override
		public Point getPoint() {
			return vertex.getPoint();
		}

		@Override
		public GraphNode getOriginalVertex() {
			return vertex;
		}
		
	}

	private static class GraphEdgeAssignmentImpl extends AbstractGraphAssigment
			implements GraphEdgeAssignment {

		private PinnedLocation pinnedLocation;

		public GraphEdgeAssignmentImpl(Long id, AroEntity aroEntity,
				PinnedLocation pinnedLocation) {
			super(id, aroEntity);
			this.pinnedLocation = pinnedLocation;
			if (pinnedLocation == null) {
				throw new NullPointerException();
			}
		}

		@Override
		public GraphEdgeAssignment getAsRootEdgeAssignment() {

			if (pinnedLocation.getGeoSegment() == null) {
				return this;
			}

			GeoSegmentTransform transform = pinnedLocation.getGeoSegment()
					.getParentTransform();

			// TODO add track identity transform
			if (transform == null) {
				return this;
			}

			return new GraphEdgeAssignmentImpl(super.getId(),
					super.getAroEntity(),
					transform.toRootEdgePin(pinnedLocation));

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
			return new ToStringBuilder(this)
					.append("pinnedLocation", pinnedLocation)
					.appendSuper(super.toString()).toString();
		}

	}

}
