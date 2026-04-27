package com.trendburada.shared;

public class BadRequestException extends BusinessException {

    public BadRequestException(String message) {
        super(400, message);
    }
}
