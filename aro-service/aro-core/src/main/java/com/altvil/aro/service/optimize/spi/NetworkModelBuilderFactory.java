package com.altvil.aro.service.optimize.spi;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;

public interface NetworkModelBuilderFactory {

	public NetworkModelBuilder create(NetworkData networkData,
			FtthThreshholds fiberConstraints);

}
