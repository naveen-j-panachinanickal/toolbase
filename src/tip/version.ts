/**
 * TIP — Toolbase Interoperability Protocol
 * Protocol version constant.
 *
 * Bump this when making breaking changes to the protocol shape.
 * Consumer code should store & compare against this when loading
 * saved pipelines (see validators.ts).
 */

export const TIP_VERSION = '1.0' as const;
export type TIPVersion = typeof TIP_VERSION;
