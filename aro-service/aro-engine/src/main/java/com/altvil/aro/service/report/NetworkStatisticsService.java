package com.altvil.aro.service.report;


public interface NetworkStatisticsService {

	ReportGenerator createReportGenerator();

	NetworkStatistic createNetworkStatistic(NetworkStatisticType type,
			double value);

}
