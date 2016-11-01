package com.altvil.aro.service.processing.impl;

import com.altvil.aro.persistence.repository.user_data.SourceLocationEntity;
import com.opencsv.CSVReader;

import java.io.Reader;

public class SourceLocationEntityReader {

    private final CSVReader csvReader;

    interface PropertAssignment {

    }

    public SourceLocationEntityReader(Reader reader) {
        csvReader = new CSVReader(reader, ',','"');
    }

    SourceLocationEntity readSourceLocations(){
        return null;
    }
}
