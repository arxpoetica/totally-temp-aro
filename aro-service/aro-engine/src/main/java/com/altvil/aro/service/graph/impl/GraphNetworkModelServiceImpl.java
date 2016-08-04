package com.altvil.aro.service.graph.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.graph.GraphNetworkModelBuilder;
import com.altvil.aro.service.graph.GraphNetworkModelService;
import com.altvil.aro.service.graph.builder.CoreGraphNetworkModelService;
import com.altvil.aro.service.graph.builder.CoreGraphNetworkModelService.GraphBuilderContext;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.model.EdgeData;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.segment.RatioSection;
import com.altvil.aro.service.graph.segment.impl.DefaultGeoRatioSection;
import com.altvil.aro.service.price.PricingModel;
import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.CableConstructionEnum;

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

		//private PricingModel pricing;
	
		@Override
		public GraphNetworkModelBuilder setPricingModel(
				PricingModel pricingModel) {
			//this.pricing = pricingModel ;
			return this;
		}



		@Override
		public GraphBuilderContext createContext() {
			return new DefaultGraphBuilderContext() ;
		}



		@Override
		public GraphNetworkModel build() {
			return doBuild(new DefaultGraphBuilderContext());
		}

		protected abstract GraphNetworkModel doBuild(
				GraphBuilderContext ctx);

	}

	private class DefaultGraphBuilderContext implements GraphBuilderContext {
		
		public DefaultGraphBuilderContext() {
			super();
		}

		@Override
		public RatioSection convert(CableConduitEdge edge) {
			return new DefaultGeoRatioSection(edge.getStartRatio(),
					edge.getEndRatio(), edge
							.getCableConstructionEnum());
		}

		@Override
		public CableConstructionEnum getDefaultCableConstruction() {
			return CableConstructionEnum.ESTIMATED;
		}

	}

	
	
	
}
