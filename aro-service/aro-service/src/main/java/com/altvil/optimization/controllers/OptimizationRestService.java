package com.altvil.optimization.controllers;

import org.springframework.web.bind.annotation.RestController;

@RestController
public class OptimizationRestService {
/*
	OptimizationMonitor monitor = new OptimizationMonitor();
	@Autowired
	OptimizationService optimizationController;
	@Autowired
	OptimizationStatusManager statusManager;
	AtomicInteger optimizationId = new AtomicInteger(1);
	@Autowired
	@Qualifier("optimizationMasterNode")
	private OptimizationMasterNode masterNode;
	@Autowired
	private Environment env;

	@PostConstruct
	private void init(){
		System.out.println();
	}

	@RequestMapping(value = "/optimization2", produces = "application/json", method = RequestMethod.POST)
	public
	@ResponseBody
	OptimizationResponse performOptimization(@RequestBody OptimizationInputs inputs) {
		int id = optimizationId.getAndIncrement();
		AnalysisStatus status = statusManager.createAnalysisStatus(id);
		optimizationController.performOptimization(id, inputs, status);
		OptimizationResponse optimizationResponse = new OptimizationResponse(status, id);
		return optimizationResponse;
	}
	
	@RequestMapping(value="/optimization2/progress/{id}", produces="application/json", method = RequestMethod.GET)
	public @ResponseBody OptimizationResponse progress(@PathVariable("id") int id){
		AnalysisStatus status = statusManager.getProgress(id);
		OptimizationResponse optimizationResponse = new OptimizationResponse(status, id);
		return optimizationResponse;
	}
	
	@RequestMapping(value="/optimization2/cancel/{id}", produces="application/json", method = RequestMethod.GET)
	public @ResponseBody OptimizationResponse cancel(@PathVariable("id") int id){
		AnalysisStatus status = statusManager.getProgress(id);
		optimizationController.cancel(id, status);
		OptimizationResponse optimizationResponse = new OptimizationResponse(status, id);
		return optimizationResponse;
	}

	@RequestMapping(value = "/optimization2/cancel/{optimizationId}/{serviceAreaId}", produces = "application/json", method = RequestMethod.GET)
	public
	@ResponseBody
	OptimizationResponse cancel(@PathVariable("optimizationId") int id, @PathVariable("serviceAreaId") int serviceAreaId) {
		AnalysisStatus status = statusManager.getProgress(id);
		optimizationController.cancel(id, status, serviceAreaId);
		OptimizationResponse optimizationResponse = new OptimizationResponse(status, id);
		return optimizationResponse;
	}
	*/
}
