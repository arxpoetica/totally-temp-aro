package com.altvil.netop.services;

import org.springframework.stereotype.Service;

/**
 * Created by kwysocki on 05.11.15.
 */
@Service
public class CoverageController {
	/*
    private final Logger logger = Logger.getLogger(this.getClass());
    @Autowired
    CoverageResultsDbWriterJPA dbWriterJPA;
    @Autowired
    DslamAnalysisController dslamAnalysisController;
    @Autowired
    FiberCoverageController fiberCoverageController;
    @Autowired
    AnalysisMonitor analysisMonitor;
    AnalysisExecutorService executorService = new AnalysisExecutorService();

    @Transactional
    public Integer calculateCoverage(CoverageInputs coverageInputs) throws InterruptedException {
        CoverageInputsEntity coverageInputsEntity = new CoverageInputsEntity(coverageInputs);
        coverageInputsEntity = dbWriterJPA.saveInputs(coverageInputsEntity);

        Integer coverageInputsId = coverageInputsEntity.getId();

        executorService.execute(() -> {
            try {
                calculateCoverage(coverageInputs, coverageInputsId);
            } catch (InterruptedException e) {
                logger.error("Interrupted", e);
            }
        });

        return coverageInputsId;

    }

    @Transactional
    private void calculateCoverage(CoverageInputs coverageInputs, Integer coverageInputsId) throws InterruptedException {
        dbWriterJPA.clearPreviousResults(coverageInputs.getAnalysisId(), coverageInputs.getUserId());

        AnalysisMonitor.AnalysisStatus status = analysisMonitor.createAnalysisStatus(coverageInputsId);
        try {
            if (coverageInputs.getCoverageMethodology() != null) {
                dslamAnalysisController.performAnalysis(coverageInputs, status, coverageInputsId);
            }
            if (coverageInputs.getFiberCoverageTypeEnum() != null) {
                fiberCoverageController.calculateCoverageAndSaveToDb(coverageInputs, coverageInputsId, status);
            }
            if (!status.isError() && !status.isCanceled())
                status.analyzingStepsDone();
        } catch (Exception e) {
            logger.error(e);
            status.setError(e);
            throw e;
        }
    }


    public ProgressResponse getProgress(Integer coverageInputsId) {
        AnalysisMonitor.AnalysisStatus progress = analysisMonitor.getProgress(coverageInputsId);
        String status;
        if (progress.isError()) {
            status = "error";

        } else if (progress.isCanceled()) {
            status = "cancelled";
        } else if (progress.isAnalyzingStepsDone()) {
            status = "done";
        } else {
            status = "running";
        }
        ProgressResponse progressResponse = new ProgressResponse(coverageInputsId, progress.getProgressPercentage(), status, progress.getException());
        return progressResponse;
    }

    public ProgressResponse cancel(Integer coverageInputsId) {
        analysisMonitor.getProgress(coverageInputsId).setCanceled(true);
        return getProgress(coverageInputsId);

    }*/
}
