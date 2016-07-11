package com.altvil.aro.service.price.impl;

import java.util.Collection;
import java.util.Date;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.eclipse.jetty.util.log.Log;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.entity.DropCable;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.plan.impl.PlanServiceImpl;
import com.altvil.aro.service.price.PricingModel;
import com.altvil.aro.service.price.PricingService;
import com.altvil.aro.service.price.engine.PriceModelBuilder;
import com.altvil.aro.service.price.engine.PricingEngine;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.reference.VolatileReference;

@Service
public class PricingServiceImpl implements PricingService {
	
	private static final Logger log = LoggerFactory
			.getLogger(PricingServiceImpl.class.getName());


	private NetworkPlanRepository priceRepository;
	private VolatileReference<PricingModel> modelRef;
	private PricingEngine pricingEngine;

	@Autowired
	public PricingServiceImpl(NetworkPlanRepository priceRepository,
			PricingEngine pricingEngine) {
		super();
		this.priceRepository = priceRepository;
		this.pricingEngine = pricingEngine;

		// TODO version Tracking on price Model
		modelRef = new VolatileReference<PricingModel>(
				() -> loadPricingModel(), 1000L * 60L * 5L);
	}

	@Override
	public PriceModelBuilder createBuilder(String state, Date date) {
		return pricingEngine.createPriceModelBuilder(getPricingModel(state,
				date));
	}

	@Override
	public PricingModel getPricingModel(String state, Date date) {
		return modelRef.get();
	}

	private PricingModel loadPricingModel() {
		return new PriceBuilder().create(StreamUtil.map(priceRepository
				.queryPriceModelElements(),
				r -> new PriceElement(r[0].toString(), r[1].toString(),
						((Number) r[2]).doubleValue())));
	}

	private interface NetworkPricing {
		public double price(double atomicCount);
	}

	private abstract static class AbstractPrice implements NetworkPricing {

		public AbstractPrice() {
			super();
		}

	}

	private static class MaterialPrice extends AbstractPrice {
		private double price;

		public MaterialPrice(double price) {
			super();
			this.price = price;
		}

		@Override
		public double price(double atomicCount) {
			return price;
		}

	}

	private static class AtomicUnitPricing extends AbstractPrice {
		private double price;

		public AtomicUnitPricing(double price) {
			super();
			this.price = price;
		}

		@Override
		public double price(double atomicCount) {
			return price * atomicCount;
		}

	}

	private interface FiberPricing {
		public double price(double meters);
	}

	private static class FiberUnitPricing implements FiberPricing {
		private double price;

		public FiberUnitPricing(double price) {
			this.price = price;
		}

		@Override
		public double price(double fiberLength) {
			return price * fiberLength;
		}
	}

	private static class CompositePrice extends AbstractPrice {
		Collection<NetworkPricing> networkPricing;

		public CompositePrice(Collection<NetworkPricing> networkPricing) {
			super();
			this.networkPricing = networkPricing;
		}

		@Override
		public double price(double atomicCount) {
			double price = 0;
			for (NetworkPricing pricing : networkPricing) {
				price += pricing.price(atomicCount);
			}
			return price;
		}
	}

	// / TODO Convert to Full Pricing Model (This is very simple implementation
	// that is too hard coded)

	private static class CodeMapping {
		public static final CodeMapping MAPPING = new CodeMapping();

		Map<MaterialType, String> networkMapping = new EnumMap<>(
				MaterialType.class);
		Map<FiberType, String> fiberMapping = new EnumMap<>(FiberType.class);

		private CodeMapping() {
			init();
		}

		private void add(MaterialType type, String code) {
			networkMapping.put(type, code);
		}

		private void add(FiberType type, String code) {
			fiberMapping.put(type, code);
		}

		public String getCode(MaterialType materialType) {
			return networkMapping.get(materialType);
		}

		public String getCode(FiberType ft) {
			return fiberMapping.get(ft);
		}

		private void init() {
			add(MaterialType.BFT, "bulk_distribution_hub");
			add(MaterialType.CO, "central_office");
			add(MaterialType.FDT, "fiber_distribution_terminal");
			add(MaterialType.FDH, "fiber_distribution_hub");

			add(FiberType.FEEDER, "feeder_fiber");
			add(FiberType.DISTRIBUTION, "distribution_fiber");
		}
	}

	private static class PriceBuilder {

		public PricingModel create(Collection<PriceElement> priceElements) {

			Map<String, List<PriceElement>> map = priceElements.stream()
					.collect(Collectors.groupingBy(PriceElement::getName));

			return new DefaultPriceModel(resolveNetworkPricing(map),
					resolveFiberPricing(map));
		}

		private Map<MaterialType, NetworkPricing> resolveNetworkPricing(
				Map<String, List<PriceElement>> map) {
			Map<MaterialType, NetworkPricing> networkPricing = new EnumMap<>(
					MaterialType.class);

			for (MaterialType mt : MaterialType.values()) {
				networkPricing.put(mt, createNetworkPrice(map
						.get(CodeMapping.MAPPING.getCode(mt))));
			}
			return networkPricing;
		}

		private Map<FiberType, FiberPricing> resolveFiberPricing(
				Map<String, List<PriceElement>> map) {
			Map<FiberType, FiberPricing> fiberPricing = new EnumMap<>(
					FiberType.class);

			for (FiberType ft : FiberType.values()) {
				fiberPricing.put(ft, createFiberPricing(map
						.get(CodeMapping.MAPPING.getCode(ft))));
			}
			return fiberPricing;
		}

		private NetworkPricing createNetworkPrice(
				Collection<PriceElement> priceElements) {

			if (priceElements == null || priceElements.size() == 0) {
				return new MaterialPrice(0);
			}

			List<NetworkPricing> prices = StreamUtil.map(priceElements,
					this::createPrice);

			if (prices.size() == 1) {
				return prices.iterator().next();
			}

			return new CompositePrice(prices);

		}

		private FiberPricing createFiberPricing(
				Collection<PriceElement> priceElements) {
			if (priceElements == null || priceElements.size() == 0) {
				return new FiberUnitPricing(0);
			}

			return new FiberUnitPricing(priceElements.iterator().next()
					.getPrice());
		}

		private NetworkPricing createPrice(PriceElement pe) {

			if (pe.getUom().equals("atomic_feeder_unit")) {
				return new AtomicUnitPricing(pe.getPrice());
			}

			return new MaterialPrice(pe.getPrice());
		}

	}

	private static class PriceElement {
		private String name;
		private String uom;
		private double price;

		public PriceElement(String name, String uom, double price) {
			super();
			this.name = name;
			this.uom = uom;
			this.price = price;
		}

		public String getName() {
			return name;
		}

		public String getUom() {
			return uom;
		}

		public double getPrice() {
			return price;
		}
	}

	private static class DefaultPriceModel implements PricingModel {

		private Map<MaterialType, NetworkPricing> priceMappng = new EnumMap<>(
				MaterialType.class);

		private Map<FiberType, FiberPricing> fiberMap;

		public DefaultPriceModel(Map<MaterialType, NetworkPricing> priceMap,
				Map<FiberType, FiberPricing> fiberMap) {
			this.priceMappng = priceMap;
			this.fiberMap = fiberMap;
		}

		@Override
		public double getPrice(DropCable dropCable) {
			// return 0.5 * dropCable.getLength();
			return 0;
		}

		@Override
		public double getMaterialCost(MaterialType type) {
			return getMaterialCost(type, 0);
		}

		@Override
		public double getMaterialCost(MaterialType type, double atomicUnit) {
			
			NetworkPricing networkPricing =  priceMappng.get(type) ;
			
			if( networkPricing == null ) {
				log.error("Failed to Map MaterialType return 0 price " + type);
				return 0 ;
			}
			
			return networkPricing.price(atomicUnit);
		}

		@Override
		public double getFiberCostPerMeter(FiberType fiberType,
				int requiredFiberStrands) {
			return fiberMap.get(fiberType).price(1);
		}

	}

}
