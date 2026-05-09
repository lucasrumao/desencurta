package com.urlexpander.exception;

public class MaxRedirectsException extends RuntimeException {
    public MaxRedirectsException(String message) { super(message); }
}
