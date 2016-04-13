package com.altvil.aro.service.entity.impl;

import java.util.Collection;
import java.util.Collections;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.AroEntityVisitor;
import com.altvil.aro.service.entity.AssignedEntityDemand;
import com.altvil.aro.service.entity.BulkFiberConsumer;
import com.altvil.aro.service.entity.BulkFiberTerminal;
import com.altvil.aro.service.entity.CentralOfficeEquipment;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.DropCable;
import com.altvil.aro.service.entity.DropCableCount;
import com.altvil.aro.service.entity.DropCableSummary;
import com.altvil.aro.service.entity.FDHEquipment;
import com.altvil.aro.service.entity.FDTEquipment;
import com.altvil.aro.service.entity.JunctionNode;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationDropAssignment;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.RemoteTerminal;
import com.altvil.aro.service.entity.RootEntity;
import com.altvil.aro.service.entity.SplicePoint;
import com.altvil.utils.EntityDoubleSum;

public class EntityFactory {

	public static EntityFactory FACTORY = new EntityFactory();

	private AtomicLong idGen = new AtomicLong(-1);

	private Long ensureId(Long id) {
		return id == null ? idGen.getAndDecrement() : id;
	}

	public LocationEntity createLocationEntity(long locationId,
			LocationDemand coverageAggregateStatistic) {
		return new LocationEntityImpl(locationId, coverageAggregateStatistic);
	}

	public BulkFiberTerminal createBulkFiberTerminal(
			AssignedEntityDemand assignedEntityDemand) {
		return new BulkFiberTerminalImpl(ensureId(null), assignedEntityDemand);
	}

	public BulkFiberConsumer createBulkFiberConsumer(
			DemandStatistic locationEntityDemand) {
		return null;
	}
	
	public JunctionNode createJunctionNode() {
		return new JunctionImpl(ensureId(null)) ;
	}

	public FDTEquipment createFdt(Long id,
			Collection<LocationDropAssignment> dropAssignments) {
		return new DefaultFDT(ensureId(id), dropAssignments);
	}

	public FDTEquipment createFdt(Long id) {
		return createFdt(null, Collections.emptyList());
	}

	public LocationDropAssignment createDropAssignment(
			AssignedEntityDemand entity, double dropLengthMeters,
			DropCable dropCable, double fiberDemand) {
		return new LocationDropAssignmentImpl(ensureId(null), entity,
				dropLengthMeters, dropCable);
	}

	public FDHEquipment createFdh(Long id, int splitterCount) {
		return new DefaultFDH(ensureId(id), splitterCount);
	}

	public RemoteTerminal createRemoteTerminal(Long id) {
		return new RemoteTerminalImpl(ensureId(id));
	}

	public RootEntity createRemoteTerminal() {
		return new RootEntityImpl(ensureId(null));
	}

	public SplicePoint createSplicePoint(Long id) {
		return new SplicePointImpl(ensureId(id));
	}

	public CentralOfficeEquipment createCentralOfficeEquipment(Long objectId) {
		return new DefaultCO(ensureId(objectId));
	}

	public static class DefaultFDT extends AbstractEntity implements
			FDTEquipment {

		/**
		 * 
		 */
		private static final long serialVersionUID = 1L;

		private DropCableSummary dropCableSummary = null; // lazyLoaded

		private Collection<LocationDropAssignment> dropAssignments;

		public DefaultFDT(Long id,
				Collection<LocationDropAssignment> dropAssignments) {
			super(id);
			this.dropAssignments = dropAssignments;
		}

		@Override
		public DropCableSummary getDropCableSummary() {
			if (dropCableSummary == null) {
				dropCableSummary = calcDropCableSummary();
			}

			return dropCableSummary;
		}

		private DropCableSummary calcDropCableSummary() {
			EntityDoubleSum<DropCable> summer = new EntityDoubleSum<DropCable>();

			dropAssignments.forEach(da -> {
				summer.add(da.getDropCable(), da.getAssignedEntityDemand()
						.getDemand());
			});

			return new DropCableSummary(summer.getTotals().entrySet().stream()
					.map(e -> new DropCableCount(e.getKey(), e.getValue()))
					.collect(Collectors.toList()));

		}

		@Override
		public Collection<LocationDropAssignment> getDropAssignments() {
			return dropAssignments;
		}

		@Override
		public Class<? extends AroEntity> getType() {
			return FDTEquipment.class;
		}

		@Override
		public void accept(AroEntityVisitor visitor) {
			visitor.visit(this);
		}

	}

	public static class DefaultFDH extends AbstractEntity implements
			FDHEquipment {

		/**
		 * 
		 */
		private static final long serialVersionUID = 1L;

		private int splitterCount;

		public DefaultFDH(Long id, int splitterCount) {
			super(id);
			this.splitterCount = splitterCount;
		}

		@Override
		public Class<? extends AroEntity> getType() {
			return FDHEquipment.class;
		}

		@Override
		public void accept(AroEntityVisitor visitor) {
			visitor.visit(this);
		}

		@Override
		public int getSplitterCount() {
			return splitterCount;
		}

	}
	
	
	public static class JunctionImpl extends AbstractEntity implements JunctionNode {

		/**
		 * 
		 */
		private static final long serialVersionUID = 1L;

		public JunctionImpl(Long objectId) {
			super(objectId);
		}

		@Override
		public Class<? extends AroEntity> getType() {
			return JunctionNode.class ;
		}

		@Override
		public void accept(AroEntityVisitor visitor) {
			visitor.visit(this) ;
		}
		
		
		
	}

	public static class SplicePointImpl extends AbstractEntity implements
			SplicePoint {

		/**
		 * 
		 */
		private static final long serialVersionUID = 1L;

		public SplicePointImpl(Long id) {
			super(id);
		}

		@Override
		public Class<? extends AroEntity> getType() {
			return SplicePoint.class;
		}

		@Override
		public void accept(AroEntityVisitor visitor) {
			visitor.visit(this);
		}

	}

	public static class RootEntityImpl extends AbstractEntity implements
			RootEntity {

		/**
		 * 
		 */
		private static final long serialVersionUID = 1L;

		public RootEntityImpl(Long id) {
			super(id);
		}

		@Override
		public Class<? extends AroEntity> getType() {
			return RootEntity.class;
		}

		@Override
		public void accept(AroEntityVisitor visitor) {
			visitor.visit(this);
		}

	}

	public static class RemoteTerminalImpl extends AbstractEntity implements
			RemoteTerminal {

		/**
		 * 
		 */
		private static final long serialVersionUID = 1L;

		public RemoteTerminalImpl(Long id) {
			super(id);
		}

		@Override
		public Class<? extends AroEntity> getType() {
			return RemoteTerminal.class;
		}

		@Override
		public void accept(AroEntityVisitor visitor) {
			visitor.visit(this);
		}

	}

	public static class DefaultCO extends AbstractEntity implements
			CentralOfficeEquipment {

		/**
		 * 
		 */
		private static final long serialVersionUID = 1L;

		public DefaultCO(Long objectId) {
			super(objectId);
		}

		@Override
		public Class<? extends AroEntity> getType() {
			return CentralOfficeEquipment.class;
		}

		@Override
		public void accept(AroEntityVisitor visitor) {
			visitor.visit(this);
		}

	}

	public static class LocationDropAssignmentImpl extends AbstractEntity
			implements LocationDropAssignment {

		/**
		 * 
		 */
		private static final long serialVersionUID = 1L;
		private AssignedEntityDemand assignedEntityDemand;
		private double dropLengthInMeters;
		private DropCable dropCable;

		public LocationDropAssignmentImpl(Long id,
				AssignedEntityDemand assignedEntityDemand,
				double dropLengthInMeters, DropCable dropCable) {
			super(id);
			this.assignedEntityDemand = assignedEntityDemand;
			this.dropLengthInMeters = dropLengthInMeters;
			this.dropCable = dropCable;
		}

		@Override
		public DropCable getDropCable() {
			return dropCable;
		}

		@Override
		public AssignedEntityDemand getAssignedEntityDemand() {
			return assignedEntityDemand;
		}

		@Override
		public LocationEntity getLocationEntity() {
			return assignedEntityDemand.getLocationEntity();
		}

		@Override
		public double getDropLength() {
			return dropLengthInMeters;
		}

		@Override
		public Class<? extends AroEntity> getType() {
			return LocationDropAssignment.class;
		}

		@Override
		public void accept(AroEntityVisitor visitor) {
			visitor.visit(this);

		}

	}

	private static class BulkFiberTerminalImpl extends AbstractEntity implements
			BulkFiberTerminal {

		/**
		 * 
		 */
		private static final long serialVersionUID = 1L;
		private AssignedEntityDemand assignedEntityDemand;

		public BulkFiberTerminalImpl(Long objectId,
				AssignedEntityDemand assignedEntityDemand) {
			super(objectId);
			this.assignedEntityDemand = assignedEntityDemand;
		}

		@Override
		public Class<? extends AroEntity> getType() {
			return BulkFiberTerminal.class;
		}

		@Override
		public void accept(AroEntityVisitor visitor) {
			visitor.visit(this);
		}

		@Override
		public LocationEntity getLocationEntity() {
			return assignedEntityDemand.getLocationEntity();
		}

		@Override
		public AssignedEntityDemand getAssignedEntityDemand() {
			return assignedEntityDemand;
		}

		@Override
		public double getTotalFiberDemand() {
			return assignedEntityDemand.getLocationDemand().getDemand();
		}

	}

	public static class LocationEntityImpl extends AbstractEntity implements
			LocationEntity {

		/**
		 * 
		 */
		private static final long serialVersionUID = 1L;
		private LocationDemand coverageAggregateStatistic;

		public LocationEntityImpl(Long id,
				LocationDemand coverageAggregateStatistic) {
			super(id);
			this.coverageAggregateStatistic = coverageAggregateStatistic;
		}

		@Override
		public Class<? extends AroEntity> getType() {
			return LocationEntity.class;
		}

		@Override
		public void accept(AroEntityVisitor visitor) {
			visitor.visit(this);
		}

		@Override
		public LocationDemand getLocationDemand() {
			return coverageAggregateStatistic;
		}

	}

}
