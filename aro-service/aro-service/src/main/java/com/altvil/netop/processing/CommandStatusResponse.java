package com.altvil.netop.processing;

public class CommandStatusResponse {

    private int numberOfAreasGenerated;

    public CommandStatusResponse(int  numberOfAreasGenerated) {
        this.numberOfAreasGenerated = numberOfAreasGenerated;
    }

    public int getNumberOfAreasGenerated() {
        return numberOfAreasGenerated;
    }

    public void setNumberOfAreasGenerated(int numberOfAreasGenerated) {
        this.numberOfAreasGenerated = numberOfAreasGenerated;
    }
}
