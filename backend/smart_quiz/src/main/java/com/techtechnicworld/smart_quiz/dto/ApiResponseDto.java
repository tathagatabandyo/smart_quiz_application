package com.techtechnicworld.smart_quiz.dto;

public record ApiResponseDto<T>(
        boolean error,
        String message,
        T data,
        String code) {
    public ApiResponseDto(boolean error, String message, T data) {
        this(error, message, data, null);
    }

    public ApiResponseDto(boolean error, String message) {
        this(error, message, null, null);
    }
}