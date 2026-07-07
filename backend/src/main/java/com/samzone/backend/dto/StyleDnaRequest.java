package com.samzone.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class StyleDnaRequest {
    private StyleDnaAnswers answers;
    // Accepted for API-contract compatibility (spec: "factor in real
    // wishlist/cart if present"), but not yet actioned - cart/wishlist in
    // this app are frontend-only (localStorage, see frontend/src/utils/cart.ts),
    // there's no backend user/cart/wishlist persistence to look this up against.
    private Long userId;
}
