package com.urlexpander.model;

public class RedirectHop {

    private String url;
    private int statusCode;

    public RedirectHop() {}

    public RedirectHop(String url, int statusCode) {
        this.url = url;
        this.statusCode = statusCode;
    }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public int getStatusCode() { return statusCode; }
    public void setStatusCode(int statusCode) { this.statusCode = statusCode; }
}
