package com.altvil.aro.service.graph.segment.transform;

import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;

public class TransformFactory {

	public static final TransformFactory FACTORY = new TransformFactory();

	public SplitTransform createSplitTransform(double offsetRatio,
			GeoSegment parent) {
		return new SplitTransformImpl(parent, offsetRatio);
	}

	public FlippedTransform createFlippedTransform(GeoSegment parent) {
		return new FlippedTransformImpl(parent);
	}

	private static class TransformedPoint {

		private GeoSegment currentSegment = null;
		private double ratio = Double.NaN;
		private double offsetDistance = Double.NaN;

		public TransformedPoint() {
		}

		public void update(double ratio, GeoSegment gs) {
			this.currentSegment = gs;
			this.ratio = ratio;
			this.offsetDistance = Double.NaN;
		}

		public GeoSegment getCurrentSegment() {
			return currentSegment;
		}

		public double getOffsetDistance() {

			if ( Double.isNaN(this.offsetDistance) ) {
				this.offsetDistance = this.ratio
						* this.currentSegment.getLength();
			}

			return offsetDistance;
		}

		public double getOffsetRatio() {

			if (Double.isNaN(this.ratio)) {
				this.ratio = offsetDistance / this.currentSegment.getLength();
			}

			return ratio;
		}

	}

	private static abstract class AbstractTransform implements
			GeoSegmentTransform {

		private GeoSegment targetGeoSegment;

		public AbstractTransform(GeoSegment targetGeoSegment) {
			super();
			this.targetGeoSegment = targetGeoSegment;
		}

		@Override
		public GeoSegment getTargetGeoSegment() {
			return targetGeoSegment;
		}

		public abstract TransformedPoint transform(TransformedPoint p);

		@Override
		public PinnedLocation toRootEdgePin(PinnedLocation pl) {

			TransformedPoint p = new TransformedPoint();
			p.update(pl.getOffsetRatio(), pl.getGeoSegment());

			AbstractTransform t = this;

			while (t != null) {
				p = t.transform(p);
				t = (AbstractTransform) t.getTargetGeoSegment()
						.getParentTransform();
			}
			
			System.out.println("Transformed "+  pl.getOffsetRatio() + " " + pl.getOffset() + "->" +p.getOffsetRatio() + " " + p.getOffsetDistance()) ;

			return p.getCurrentSegment().pinLocation(p.getOffsetRatio());

		}
	}

	private static class FlippedTransformImpl extends AbstractTransform
			implements FlippedTransform {

		public FlippedTransformImpl(GeoSegment targetGeoSegment) {
			super(targetGeoSegment);
		}

		public TransformedPoint transform(TransformedPoint p) {
			p.update((1 - p.getOffsetRatio()), getTargetGeoSegment());
			return p;
		}
	}

	private static class SplitTransformImpl extends AbstractTransform implements
			SplitTransform {

		private double offsetRatio;
		private double offsetDistance;

		// public double getOffsetRatio() {
		// return offsetRatio ;
		// }

		public SplitTransformImpl(GeoSegment targetGeoSegment,
				double offsetRatio) {
			super(targetGeoSegment);
			this.offsetRatio = offsetRatio;
			this.offsetDistance = this.offsetRatio
					* targetGeoSegment.getLength();
		}

		public double getOffsetDistance() {
			return offsetDistance;
		}

		public TransformedPoint transform(TransformedPoint p) {
			double val = p.getOffsetDistance() + getOffsetDistance();
			double ratio = val / getTargetGeoSegment().getLength();
			p.update(ratio, getTargetGeoSegment());
			return p;
		}

	}

}
