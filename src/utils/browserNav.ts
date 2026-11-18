// Full-page navigation, in one place so tests can stand in for it
// (jsdom can't follow or spy on window.location).
export const assignLocation = (url: string) => window.location.assign(url);
