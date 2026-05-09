package com.urlexpander.model;

public class PreviewResponse {
    private String title;
    private String description;
    private String image;
    private String url;

    public PreviewResponse() {}

    public PreviewResponse(String title, String description, String image, String url) {
        this.title = title;
        this.description = description;
        this.image = image;
        this.url = url;
    }

    public String getTitle()       { return title; }
    public String getDescription() { return description; }
    public String getImage()       { return image; }
    public String getUrl()         { return url; }

    public void setTitle(String title)             { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setImage(String image)             { this.image = image; }
    public void setUrl(String url)                 { this.url = url; }
}