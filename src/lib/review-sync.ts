import type { TIPBundle } from '@/tip/protocol';
import { TIPError } from '@/tip/errors';

/**
 * ReviewSync — Synchronization bridge for Human Review nodes.
 * 
 * Allows a Tool's `invoke` function (logical layer) to wait for 
 * a User's approval in the UI (presentation layer).
 */

type ReviewPromise = {
    promise: Promise<TIPBundle>;
    resolve: (bundle: TIPBundle) => void;
    reject: (error: Error) => void;
    inputBundle: TIPBundle;
};

const activeReviews = new Map<string, ReviewPromise>();

export const ReviewSync = {
    /**
     * Called by the Tool Executor to pause execution and wait for review.
     */
    async requestReview(nodeId: string, inputBundle: TIPBundle): Promise<TIPBundle> {
        // If there's already a review for this node, clean it up
        if (activeReviews.has(nodeId)) {
            activeReviews.get(nodeId)?.reject(new Error('Review superseded by new execution'));
            activeReviews.delete(nodeId);
        }

        let resolve!: (bundle: TIPBundle) => void;
        let reject!: (error: Error) => void;

        const promise = new Promise<TIPBundle>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        activeReviews.set(nodeId, { promise, resolve, reject, inputBundle });

        return promise;
    },

    /**
     * Called by the UI (InteractionModal) when the user approves or rejects.
     */
    resolveReview(nodeId: string, approved: boolean, customBundle?: TIPBundle) {
        const review = activeReviews.get(nodeId);
        if (!review) return;

        if (approved) {
            // Pass the data through (either original or optionally modified in review)
            review.resolve(customBundle || review.inputBundle);
        } else {
            // Rejecting stopping the pipeline with a specific error
            review.reject(new TIPError('EXECUTION_FAILED', 'Human reviewer rejected this step', -1, 'system/human-review'));
        }

        activeReviews.delete(nodeId);
    },

    /**
     * Get the input bundle for a node that is currently pending review.
     */
    getPendingInput(nodeId: string): TIPBundle | null {
        return activeReviews.get(nodeId)?.inputBundle || null;
    },

    /**
     * Check if a node is currently waiting for human review.
     */
    isPending(nodeId: string): boolean {
        return activeReviews.has(nodeId);
    }
};
