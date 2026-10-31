# Frontend Reliability and State Management Specification
**Project:** oldrcesupport/my_website  
**Framework:** Next.js 15.5.28, React 19, TypeScript 5.8, Tailwind CSS v4  

---

## 1. Error Handling and API Client Architecture
1. **Typed Error Hierarchy:**
   - Every API failure produces an instance of `ApiError` containing `code`, `message`, `httpStatus`, and `retryable`.
   - Network dropouts are flagged as `retryable: true` with distinct Persian messaging.
2. **Fail-Closed State Initialization:**
   - Homepage and checkout forms initialize in a locked state until settings are explicitly verified.
   - Zero hardcoded pricing fallbacks.
3. **Memory Leak Prevention:**
   - `AbortController` bound to every client-side asynchronous fetch.
   - All `setInterval` polling loops subscribe to `visibilitychange` events and cancel when unmounted.
4. **Form Validation & Digit Normalization:**
   - Bidirectional normalization of Persian (`۰-۹`) and Arabic (`٠-٩`) numerals to ASCII (`0-9`).
   - Strict Iranian mobile number regex: `^(\+98|0)?9\d{9}$`.
   - Preserve user input on recoverable gateway or network errors.

---

## 2. Audio & Haptic Feedback Isolation
- Web Audio API `AudioContext` and `navigator.vibrate` are wrapped in non-throwing handlers.
- Audio synthesis errors never interrupt ticket redemption state or UI rendering.

