package com.urlexpander.model;

import java.time.Instant;

public class ErrorResponse {
    private String message;
    private String code;
    private Instant timestamp;

    public ErrorResponse(String message, String code) {
        this.message = message;
        this.code = code;
        this.timestamp = Instant.now();
    }

    public String getMessage() { return message; }
    public String getCode() { return code; }
    public Instant getTimestamp() { return timestamp; }
}
