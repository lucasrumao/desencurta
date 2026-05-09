package com.urlexpander.model;

import java.util.List;

public class ExpandResponse {

    private String originalUrl;
    private String finalUrl;
    private int statusCode;
    private List<RedirectHop> redirects;
    private String domain;
    private long durationMs;

    public ExpandResponse() {}

    public ExpandResponse(String originalUrl, String finalUrl, int statusCode,
                          List<RedirectHop> redirects, String domain, long durationMs) {
        this.originalUrl = originalUrl;
        this.finalUrl = finalUrl;
        this.statusCode = statusCode;
        this.redirects = redirects;
        this.domain = domain;
        this.durationMs = durationMs;
    }

    public String getOriginalUrl() { return originalUrl; }
    public void setOriginalUrl(String originalUrl) { this.originalUrl = originalUrl; }

    public String getFinalUrl() { return finalUrl; }
    public void setFinalUrl(String finalUrl) { this.finalUrl = finalUrl; }

    public int getStatusCode() { return statusCode; }
    public void setStatusCode(int statusCode) { this.statusCode = statusCode; }

    public List<RedirectHop> getRedirects() { return redirects; }
    public void setRedirects(List<RedirectHop> redirects) { this.redirects = redirects; }

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }
}
