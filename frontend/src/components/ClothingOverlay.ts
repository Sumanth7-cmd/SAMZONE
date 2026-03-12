import { useEffect, useRef, useCallback } from 'react';
import type { Product } from '../services/api';
import { PoseDetectionService, type PoseKeypoints } from './PoseDetector';

export interface OverlayItem {
    product: Product;
    position: { x: number; y: number; width: number; height: number };
    opacity: number;
    rotation: number;
}

export class ClothingOverlayService {
    private static canvas: HTMLCanvasElement | null = null;
    private static ctx: CanvasRenderingContext2D | null = null;
    private static animationId: number | null = null;
    private static overlayItems: OverlayItem[] = [];

    // Initialize overlay system
    static initialize(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    // Add clothing item to overlay
    static addClothingItem(product: Product, position: { x: number; y: number; width: number; height: number }): void {
        const overlayItem: OverlayItem = {
            product,
            position,
            opacity: 0.8,
            rotation: 0
        };

        this.overlayItems.push(overlayItem);
    }

    // Remove clothing item from overlay
    static removeClothingItem(productId: number): void {
        this.overlayItems = this.overlayItems.filter(item => item.product.id !== productId);
    }

    // Clear all overlay items
    static clearOverlay(): void {
        this.overlayItems = [];
    }

    // Start rendering loop
    static startRendering(video: HTMLVideoElement): void {
        if (!this.canvas || !this.ctx || !video) return;

        const render = () => {
            // Clear canvas
            this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw video frame (optional - for see-through effect)
            this.ctx?.globalAlpha = 0.3;
            this.ctx?.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

            // Draw overlay items
            this.ctx?.globalAlpha = 1.0;
            this.renderOverlayItems();

            // Continue animation
            this.animationId = requestAnimationFrame(render);
        };

        render();
    }

    // Stop rendering
    static stopRendering(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // Render all overlay items
    private static renderOverlayItems(): void {
        if (!this.ctx) return;

        this.overlayItems.forEach(item => {
            this.renderClothingItem(item);
        });
    }

    // Render individual clothing item
    private static renderClothingItem(item: OverlayItem): void {
        if (!this.ctx) return;

        const { product, position, opacity, rotation } = item;

        // Load and draw clothing image
        const img = new Image();
        img.onload = () => {
            if (!this.ctx) return;

            // Save context state
            this.ctx.save();

            // Apply transformations
            this.ctx.globalAlpha = opacity;
            this.ctx.translate(position.x + position.width / 2, position.y + position.height / 2);
            this.ctx.rotate((rotation * Math.PI) / 180);
            this.ctx.translate(-(position.width / 2), -(position.height / 2));

            // Draw clothing item with shadow for depth
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 5;
            this.ctx.shadowOffsetY = 5;

            // Draw the clothing image
            this.ctx.drawImage(img, position.x, position.y, position.width, position.height);

            // Restore context state
            this.ctx.restore();
        };
        img.src = product.image;
    }

    // Update clothing position based on pose keypoints
    static updatePositions(keypoints: PoseKeypoints): void {
        this.overlayItems.forEach(item => {
            const newPosition = this.calculatePositionForItem(item.product, keypoints);
            if (newPosition) {
                item.position = newPosition;
            }
        });
    }

    // Calculate position for clothing item based on pose
    private static calculatePositionForItem(product: Product, keypoints: PoseKeypoints): { x: number; y: number; width: number; height: number } | null {
        const category = product.category.toLowerCase();

        // Position based on clothing category
        if (category.includes('shirt') || category.includes('hoodie') || category.includes('jacket')) {
            // Top items - position on torso
            if (keypoints.torso) {
                return {
                    x: keypoints.torso.x,
                    y: keypoints.torso.y,
                    width: keypoints.torso.width,
                    height: keypoints.torso.height * 0.6 // Tops are shorter than full torso
                };
            }
        } else if (category.includes('pant') || category.includes('jean')) {
            // Bottom items - position below torso
            if (keypoints.torso && keypoints.hips) {
                return {
                    x: keypoints.torso.x,
                    y: keypoints.torso.y + keypoints.torso.height * 0.7,
                    width: keypoints.torso.width * 0.9,
                    height: keypoints.torso.height * 0.5
                };
            }
        }

        return null;
    }

    // Animate clothing item (fade in, rotation, etc.)
    static animateItem(productId: number, animation: 'fadeIn' | 'rotate' | 'bounce'): void {
        const item = this.overlayItems.find(item => item.product.id === productId);
        if (!item) return;

        switch (animation) {
            case 'fadeIn':
                this.animateFadeIn(item);
                break;
            case 'rotate':
                this.animateRotation(item);
                break;
            case 'bounce':
                this.animateBounce(item);
                break;
        }
    }

    // Fade in animation
    private static animateFadeIn(item: OverlayItem): void {
        const startOpacity = 0;
        const targetOpacity = 0.8;
        const duration = 500; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            item.opacity = startOpacity + (targetOpacity - startOpacity) * this.easeOutCubic(progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    // Rotation animation
    private static animateRotation(item: OverlayItem): void {
        const startRotation = item.rotation;
        const targetRotation = 360;
        const duration = 1000; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            item.rotation = startRotation + (targetRotation - startRotation) * this.easeOutCubic(progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                item.rotation = 0; // Reset to normal
            }
        };

        animate();
    }

    // Bounce animation
    private static animateBounce(item: OverlayItem): void {
        const originalY = item.position.y;
        const bounceHeight = 20;
        const duration = 800; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const bounce = Math.sin(progress * Math.PI * 2) * bounceHeight * (1 - progress);
            item.position.y = originalY - bounce;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                item.position.y = originalY;
            }
        };

        animate();
    }

    // Easing function for smooth animations
    private static easeOutCubic(t: number): number {
        return 1 - Math.pow(1 - t, 3);
    }

    // Get current overlay items
    static getOverlayItems(): OverlayItem[] {
        return [...this.overlayItems];
    }

    // Set opacity for all items
    static setGlobalOpacity(opacity: number): void {
        this.overlayItems.forEach(item => {
            item.opacity = opacity;
        });
    }

    // Add shadow effect to all items
    static enableShadow(enabled: boolean): void {
        // Shadow will be applied in renderClothingItem method
        // This is a placeholder for shadow control
    }
}
