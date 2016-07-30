package com.altvil.aro.service.graph.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.construction.CableConstructionPricing;
import com.altvil.aro.service.graph.GraphNetworkModelBuilder;
import com.altvil.aro.service.graph.GraphNetworkModelService;
import com.altvil.aro.service.graph.builder.CoreGraphNetworkModelService;
import com.altvil.aro.service.graph.builder.CoreGraphNetworkModelService.GraphBuilderContext;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.model.EdgeData;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.segment.CableConstruction;
import com.altvil.aro.service.graph.segment.RatioSection;
import com.altvil.aro.service.graph.segment.impl.DefaultGeoRatioSection;
import com.altvil.interfaces.CableConduitEdge;

@Service
public class GraphNetworkModelServiceImpl implements GraphNetworkModelService {

	private CoreGraphNetworkModelService coreService;
	
	@Autowired
	public GraphNetworkModelServiceImpl(CoreGraphNetworkModelService coreService) {
		super();
		this.coreService = coreService;
	}

	@Override
	public GraphNetworkModelBuilder build(EdgeData edgeData) {
		return new AbstractBuilder() {
			@Override
			protected GraphNetworkModel doBuild(GraphBuilderContext ctx) {
				return coreService.createGraphNetworkModel(edgeData, ctx);
			}
		};
	}
	
	

	@Override
	public GraphNetworkModelBuilder build() {
		return new AbstractBuilder() {
			@Override
			protected GraphNetworkModel doBuild(GraphBuilderContext ctx) {
				throw new RuntimeException("Operation not supported") ;
			}
		};
	}

	@Override
	public GraphNetworkModelBuilder build(NetworkData networkData) {
		return new AbstractBuilder() {
			@Override
			protected GraphNetworkModel doBuild(GraphBuilderContext ctx) {
				return coreService.createGraphNetworkModel(networkData, ctx);
			}
		};
	}

	private abstract class AbstractBuilder implements GraphNetworkModelBuilder {

		private CableConstructionPricing pricing;

		@Override
		public GraphNetworkModelBuilder setCableConstructionPricing(
				CableConstructionPricing pricing) {
			this.pricing = pricing;
			return this;
		}
		
		

		@Override
		public GraphBuilderContext createContext() {
			return new DefaultGraphBuilderContext(pricing) ;
		}



		@Override
		public GraphNetworkModel build() {
			return doBuild(new DefaultGraphBuilderContext(pricing));
		}

		protected abstract GraphNetworkModel doBuild(
				GraphBuilderContext ctx);

	}

	private class DefaultGraphBuilderContext implements GraphBuilderContext {

		private CableConstructionPricing pricing;

		public DefaultGraphBuilderContext(CableConstructionPricing pricing) {
			super();
			this.pricing = pricing;
		}

		@Override
		public RatioSection convert(CableConduitEdge edge) {
			return new DefaultGeoRatioSection(edge.getStartRatio(),
					edge.getEndRatio(), pricing.price(edge
							.getCableConstructionEnum()));
		}

		@Override
		public CableConstruction getDefaultCableConstruction() {
			return pricing.getDefaultCableConstruction();
		}

	}

	
	
	
}
