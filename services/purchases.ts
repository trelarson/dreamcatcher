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

/**
 * Link the RevenueCat customer to a Firebase user ID.
 * Call this whenever a Firebase user signs in so purchases are
 * associated with the account and sync across devices.
 */
export async function loginPurchasesUser(firebaseUid: string): Promise<void> {
  try {
    await Purchases.logIn(firebaseUid);
  } catch (error) {
    console.error("RevenueCat logIn failed:", error);
  }
}

/**
 * Switch RevenueCat back to an anonymous user.
 * Call this when the Firebase user signs out.
 */
export async function logoutPurchasesUser(): Promise<void> {
  try {
    await Purchases.logOut();
  } catch (error) {
    console.error("RevenueCat logOut failed:", error);
  }
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
