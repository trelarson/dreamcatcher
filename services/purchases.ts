import Purchases, { LOG_LEVEL } from "react-native-purchases";

// The entitlement identifier configured in the RevenueCat dashboard
export const ENTITLEMENT_ID = "premium";

export function initializePurchases() {
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_KEY;
  if (!apiKey) {
    console.warn("RevenueCat API key not set — purchases will not work.");
    return;
  }
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
}

export async function checkEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    console.error("Failed to check entitlement:", error);
    return false;
  }
}

export async function purchaseAnnualPlan(): Promise<boolean> {
  try {
    const offerings = await Purchases.getOfferings();
    const annual = offerings.current?.annual;
    if (!annual) {
      throw new Error("Annual package not found in RevenueCat offerings.");
    }
    const { customerInfo } = await Purchases.purchasePackage(annual);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error: any) {
    // User cancelled — not an error worth surfacing
    if (error?.userCancelled) return false;
    throw error;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    console.error("Failed to restore purchases:", error);
    return false;
  }
}
