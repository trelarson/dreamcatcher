import { useEffect, useState } from "react";
import Purchases, { CustomerInfo } from "react-native-purchases";
import { ENTITLEMENT_ID } from "@/services/purchases";

/**
 * Returns the current premium entitlement status and re-renders whenever
 * it changes (e.g. after a purchase, restore, or subscription expiry).
 *
 * Usage:
 *   const { isPremium, loading } = usePremium();
 */
export function usePremium(): { isPremium: boolean; loading: boolean } {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Fetch current status immediately
    Purchases.getCustomerInfo()
      .then((info: CustomerInfo) => {
        if (mounted) {
          setIsPremium(info.entitlements.active[ENTITLEMENT_ID] !== undefined);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    // Listen for real-time updates (e.g. after purchase or restore)
    const listener = (info: CustomerInfo) => {
      if (mounted) {
        setIsPremium(info.entitlements.active[ENTITLEMENT_ID] !== undefined);
      }
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      mounted = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  return { isPremium, loading };
}
