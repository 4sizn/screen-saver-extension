// Simple in-memory storage for activation state
// Service workers restart frequently, so use Set to track active tabs
const activeTabs = new Set<number>();

export function getActivationState(tabId: number): boolean {
  return activeTabs.has(tabId);
}

export function setActivationState(tabId: number, active: boolean): void {
  if (active) {
    activeTabs.add(tabId);
  } else {
    activeTabs.delete(tabId);
  }
}

export function clearTabState(tabId: number): void {
  activeTabs.delete(tabId);
}
