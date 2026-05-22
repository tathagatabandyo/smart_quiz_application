package com.techtechnicworld.smart_quiz.controller;

import com.techtechnicworld.smart_quiz.dto.ApiResponseDto;
import com.techtechnicworld.smart_quiz.dto.AuthResponse;
import com.techtechnicworld.smart_quiz.dto.LoginRequest;
import com.techtechnicworld.smart_quiz.dto.SignupRequest;
import com.techtechnicworld.smart_quiz.dto.UserDto;
import com.techtechnicworld.smart_quiz.entities.User;
import com.techtechnicworld.smart_quiz.repository.UserRepository;
import com.techtechnicworld.smart_quiz.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponseDto<AuthResponse>> signup(@Valid @RequestBody SignupRequest request) {
        AuthResponse response = authService.signup(request);
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Signup successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponseDto<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponseDto<UserDto>> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));

        UserDto userDto = UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();

        return ResponseEntity.ok(new ApiResponseDto<>(false, "User fetched successfully", userDto));
    }
}
