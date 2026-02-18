// Dynamically generate icon paths based on usage
export const appIcons = new Proxy({} as Record<string, string>, {
    get: (_, prop: string) => `/assets/thumbnails/${prop}.png`,
});

