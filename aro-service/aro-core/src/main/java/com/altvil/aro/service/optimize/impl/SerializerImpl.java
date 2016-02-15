package com.altvil.aro.service.optimize.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.assigment.impl.DefaultGraphMapping;
import com.altvil.aro.service.graph.assigment.impl.LeafGraphMapping;
import com.altvil.aro.service.graph.segment.FiberType;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.serialize.ModelSerializer;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.utils.StreamUtil;

@SuppressWarnings("unused")
public class SerializerImpl implements ModelSerializer {

	//private CompositeNetworkModel originalModel;

	//private GraphEdgeAssignment centralOffice;
	private List<FullFdhAssigmnent> fdhs = new ArrayList<>();
	//private FiberAssignment fiberAssignment;

	public SerializerImpl(CompositeNetworkModel originalModel) {
		super();
		//this.originalModel = originalModel;
	}

	@Override
	public GraphMapping serialize(GeneratingNode node, FullFdhAssigmnent fdh) {
		fdhs.add(fdh);
		return null ;
	}

	@Override
	public GraphMapping serialize(GeneratingNode node, RootAssignment root) {
//		fiberAssignment = new NetworkModelSerializer(FiberType.BACKBONE, this).serialize(node
//				.getChildren());
		return null ;
	}

	@Override
	public GraphMapping serialize(GeneratingNode node, CentralOfficeAssignment co) {
		//centralOffice = co.getGraphAssignment();
//		fiberAssignment = new NetworkModelSerializer(FiberType.FEEDER, this)
//				.serialize(node.getChildren());
		return null ;
	}

	@Override
	public GraphMapping serialize(GeneratingNode node,
			SplitterNodeAssignment fiberAssignment) {
		return null;
	}

	@Override
	public GraphMapping serialize(GeneratingNode node, FdtAssignment fdt) {
		return null ;
	}
	
	@Override
	public GraphMapping serialize(GeneratingNode node, FdhAssignment fdh) {
		return null ;
	}

//	private Map<GraphAssignment, Collection<AroEdge<GeoSegment>>> hashFiber(
//			List<FullFdhAssigmnent> fdhs) {
//		Map<GraphAssignment, Collection<AroEdge<GeoSegment>>> result = new HashMap<>();
//		fdhs.forEach(fdh -> {
//			result.put(fdh.getGraphAssignment(), fdh.getFiberAssignment()
//					.getEdges());
//		});
//		return result;
//	}

//	private com.altvil.aro.service.graph.assigment.impl.FiberSourceMapping createMapping(
//			GraphEdgeAssignment centralOffice, Collection<FullFdhAssigmnent> fdhs) {
//
//		List<GraphMapping> fdhMapping = new ArrayList<>();
//		fdhs.forEach(fdh -> {
//			fdhMapping.add(new DefaultGraphMapping(fdh.getGraphAssignment(),
//					StreamUtil.map(fdh.getFdtAssigmnents(), fdt -> {
//						return new LeafGraphMapping(fdt.getGraphAssignment(),
//								fdt.getAssignedLocations());
//					})));
//		});
//
//		return new com.altvil.aro.service.graph.assigment.impl.FiberSourceMapping(
//				centralOffice, fdhMapping);
//
//	}

	public CompositeNetworkModel getNetworkModel() {
		//TODO add Model Serialization
//		return originalModel.createNetworkModel(fiberAssignment.getEdges(),
//				hashFiber(fdhs), createMapping(centralOffice, fdhs));
		return null ;
	}

	@SuppressWarnings("unused")
	private class NetworkModelSerializer {

		private SerializerImpl serializer;
		private FiberType fiberType;
		private List<GraphMapping> graphMappings = new ArrayList<GraphMapping>();

		private List<FiberAssignment> fiberAssignments = new ArrayList<FiberAssignment>();

		public NetworkModelSerializer(FiberType fiberType,
									  SerializerImpl serializer) {
			this.fiberType = fiberType;
			this.serializer = serializer;
		}

		private FiberAssignment aggregate(Collection<FiberAssignment> fibers) {
			List<AroEdge<GeoSegment>> edges = new ArrayList<>();
			fibers.forEach(f -> {
				edges.addAll(f.getEdges());
			});
			return new DefaultFiberAssignment(fiberType, edges);
		}

		public FiberAssignment serialize(Collection<GeneratingNode> nodes) {
			dft(nodes);
			return aggregate(fiberAssignments);
		}

		private void dft(Collection<GeneratingNode> nodes) {
			nodes.forEach(c -> {
				dft(c);
			});
		}
		
		private void add(GraphMapping graphMapping) {
			graphMappings.add(graphMapping) ;
		}

		private void dft(GeneratingNode node) {

			if (node.getFiberAssignment().getFiberType() == fiberType) {
				fiberAssignments.add(node.getFiberAssignment());
				add(node.getEquipmentAssignment().serialize(node, serializer));
				dft(node.getChildren());
			}
		}
	}

}