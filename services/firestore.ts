import { auth, db } from "@/config/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export interface SavedFortune {
  id?: string;
  userId: string;
  conformityScale: number;
  lifeStage: string;
  flowState: string;
  problemCare: string;
  successDefinition: string;
  blockers: string[];
  fortuneText: string;
  parsedFortune?: any;
  createdAt: Timestamp;
}

export async function saveFortune(
  fortuneData: Omit<SavedFortune, "id" | "userId" | "createdAt">,
) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Must be signed in to save fortune");
  }

  const docRef = await addDoc(collection(db, "fortunes"), {
    ...fortuneData,
    userId: user.uid,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
}

export async function getUserFortunes(): Promise<SavedFortune[]> {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }

  const q = query(
    collection(db, "fortunes"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc"),
  );

  const querySnapshot = await getDocs(q);
  const fortunes: SavedFortune[] = [];

  querySnapshot.forEach((doc) => {
    fortunes.push({
      id: doc.id,
      ...doc.data(),
    } as SavedFortune);
  });

  return fortunes;
}
export interface SavedActionPlan {
  id?: string;
  userId: string;
  fortuneId?: string;
  pathTitle: string;
  pathWhy: string;
  pathTimeline: string;
  milestones: Array<{
    id: string;
    title: string;
    timeline: string;
    tasks: Array<{
      id: string;
      description: string;
      completed: boolean;
      resources?: Array<{
        type: string;
        title: string;
        url: string;
        description: string;
        estimatedTime?: string;
        cost: string;
      }>;
    }>;
  }>;
  createdAt: Timestamp;
  lastUpdatedAt: Timestamp;
}

export async function saveActionPlan(
  planData: Omit<
    SavedActionPlan,
    "id" | "userId" | "createdAt" | "lastUpdatedAt"
  >,
) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Must be signed in to save action plan");
  }

  const docRef = await addDoc(collection(db, "actionPlans"), {
    ...planData,
    userId: user.uid,
    createdAt: Timestamp.now(),
    lastUpdatedAt: Timestamp.now(),
  });

  return docRef.id;
}

export async function getActionPlansByFortuneId(
  fortuneId: string,
): Promise<SavedActionPlan[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Must be signed in");
  }

  const q = query(
    collection(db, "actionPlans"),
    where("userId", "==", user.uid),
    where("fortuneId", "==", fortuneId),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as SavedActionPlan,
  );
}

export async function updateActionPlan(planId: string, milestones: any[]) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Must be signed in to update action plan");
  }

  const planRef = doc(db, "actionPlans", planId);
  await updateDoc(planRef, {
    milestones,
    lastUpdatedAt: Timestamp.now(),
  });
}

export async function getActionPlanById(
  planId: string,
): Promise<SavedActionPlan | null> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Must be signed in");
  }

  const planRef = doc(db, "actionPlans", planId);
  const snap = await getDoc(planRef);

  if (!snap.exists()) return null;

  const data = snap.data();
  if (data.userId !== user.uid) throw new Error("Unauthorized");

  return { id: snap.id, ...data } as SavedActionPlan;
}

export async function getUserActionPlans(): Promise<SavedActionPlan[]> {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }

  const q = query(
    collection(db, "actionPlans"),
    where("userId", "==", user.uid),
    orderBy("lastUpdatedAt", "desc"),
  );

  const querySnapshot = await getDocs(q);
  const plans: SavedActionPlan[] = [];

  querySnapshot.forEach((doc) => {
    plans.push({
      id: doc.id,
      ...doc.data(),
    } as SavedActionPlan);
  });

  return plans;
}
