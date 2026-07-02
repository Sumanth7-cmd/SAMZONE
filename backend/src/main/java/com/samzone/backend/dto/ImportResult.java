package com.samzone.backend.dto;

public class ImportResult {
    private int totalRead;
    private int inserted;
    private int skippedDuplicate;
    private int skippedInvalid;
    private long existingCountBefore;
    private long finalDatabaseCount;
    private String status;

    public ImportResult() {
    }

    public int getTotalRead() {
        return totalRead;
    }

    public void setTotalRead(int totalRead) {
        this.totalRead = totalRead;
    }

    public int getInserted() {
        return inserted;
    }

    public void setInserted(int inserted) {
        this.inserted = inserted;
    }

    public int getSkippedDuplicate() {
        return skippedDuplicate;
    }

    public void setSkippedDuplicate(int skippedDuplicate) {
        this.skippedDuplicate = skippedDuplicate;
    }

    public int getSkippedInvalid() {
        return skippedInvalid;
    }

    public void setSkippedInvalid(int skippedInvalid) {
        this.skippedInvalid = skippedInvalid;
    }

    public long getExistingCountBefore() {
        return existingCountBefore;
    }

    public void setExistingCountBefore(long existingCountBefore) {
        this.existingCountBefore = existingCountBefore;
    }

    public long getFinalDatabaseCount() {
        return finalDatabaseCount;
    }

    public void setFinalDatabaseCount(long finalDatabaseCount) {
        this.finalDatabaseCount = finalDatabaseCount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
