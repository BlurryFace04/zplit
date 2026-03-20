import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { generateInviteCode } from './inviteCode';
import type { Group, Expense, Settlement, Member } from '../types';

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

function cleanMembers(members: Member[]): Record<string, unknown>[] {
  return members.map((m) => stripUndefined(m as unknown as Record<string, unknown>));
}

// ─── Groups ──────────────────────────────────────────────

export async function createGroupInFirestore(
  group: Group,
): Promise<string> {
  const code = generateInviteCode();

  await setDoc(doc(db, 'groups', group.id), {
    name: group.name,
    emoji: group.emoji,
    members: cleanMembers(group.members),
    myMemberId: group.myMemberId,
    inviteCode: code,
    createdAt: group.createdAt,
  });

  await setDoc(doc(db, 'inviteCodes', code), {
    groupId: group.id,
  });

  return code;
}

export async function deleteGroupInFirestore(groupId: string): Promise<void> {
  const groupDoc = await getDoc(doc(db, 'groups', groupId));
  if (groupDoc.exists()) {
    const code = groupDoc.data().inviteCode;
    if (code) {
      await deleteDoc(doc(db, 'inviteCodes', code)).catch(() => {});
    }
  }

  const expSnap = await getDocs(collection(db, 'groups', groupId, 'expenses'));
  for (const d of expSnap.docs) await deleteDoc(d.ref);

  const setSnap = await getDocs(collection(db, 'groups', groupId, 'settlements'));
  for (const d of setSnap.docs) await deleteDoc(d.ref);

  await deleteDoc(doc(db, 'groups', groupId));
}

export async function updateGroupInFirestore(
  groupId: string,
  updates: Partial<Pick<Group, 'name' | 'emoji'>>,
): Promise<void> {
  const ref = doc(db, 'groups', groupId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await setDoc(ref, { ...snap.data(), ...updates });
  }
}

export async function addMemberToGroupInFirestore(
  groupId: string,
  member: Member,
): Promise<void> {
  const ref = doc(db, 'groups', groupId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    await setDoc(ref, {
      ...data,
      members: [...(data.members || []), stripUndefined(member as unknown as Record<string, unknown>)],
    });
  }
}

export async function updateMemberZecAddressInFirestore(
  groupId: string,
  memberId: string,
  address: string,
): Promise<void> {
  const ref = doc(db, 'groups', groupId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    await setDoc(ref, {
      ...data,
      members: (data.members || []).map((m: Member) =>
        m.id === memberId ? { ...m, zecAddress: address } : m
      ),
    });
  }
}

export async function updateMemberProfileInFirestore(
  groupId: string,
  memberId: string,
  updates: { name?: string; zecAddress?: string },
): Promise<void> {
  const ref = doc(db, 'groups', groupId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    await setDoc(ref, {
      ...data,
      members: (data.members || []).map((m: Member) =>
        m.id === memberId
          ? stripUndefined({ ...m, ...updates } as unknown as Record<string, unknown>)
          : m
      ),
    });
  }
}

// ─── Join via invite code ────────────────────────────────

export async function lookupInviteCode(
  code: string,
): Promise<{ groupId: string; group: Group & { inviteCode: string } } | null> {
  const codeDoc = await getDoc(doc(db, 'inviteCodes', code.toUpperCase()));
  if (!codeDoc.exists()) return null;

  const { groupId } = codeDoc.data();
  const groupDoc = await getDoc(doc(db, 'groups', groupId));
  if (!groupDoc.exists()) return null;

  const data = groupDoc.data();
  return {
    groupId,
    group: {
      id: groupId,
      name: data.name,
      emoji: data.emoji,
      members: data.members || [],
      myMemberId: data.myMemberId,
      inviteCode: data.inviteCode,
      createdAt: data.createdAt,
    },
  };
}

export async function joinGroupInFirestore(
  groupId: string,
  member: Member,
): Promise<void> {
  const ref = doc(db, 'groups', groupId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    const existing = (data.members || []) as Member[];
    if (existing.some((m) => m.id === member.id)) return;
    await setDoc(ref, {
      ...data,
      members: [...existing, stripUndefined(member as unknown as Record<string, unknown>)],
    });
  }
}

// ─── Expenses ────────────────────────────────────────────

export async function addExpenseInFirestore(
  expense: Expense,
): Promise<void> {
  await setDoc(
    doc(db, 'groups', expense.groupId, 'expenses', expense.id),
    expense,
  );
}

export async function updateExpenseInFirestore(
  expense: Expense,
): Promise<void> {
  await setDoc(
    doc(db, 'groups', expense.groupId, 'expenses', expense.id),
    stripUndefined(expense as unknown as Record<string, unknown>),
  );
}

export async function deleteExpenseInFirestore(
  groupId: string,
  expenseId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId, 'expenses', expenseId));
}

// ─── Settlements ─────────────────────────────────────────

export async function addSettlementInFirestore(
  settlement: Settlement,
): Promise<void> {
  await setDoc(
    doc(db, 'groups', settlement.groupId, 'settlements', settlement.id),
    settlement,
  );
}

export async function deleteSettlementInFirestore(
  groupId: string,
  settlementId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId, 'settlements', settlementId));
}

// ─── Real-time listeners ─────────────────────────────────

export function subscribeToGroup(
  groupId: string,
  onGroup: (group: (Group & { inviteCode: string }) | null) => void,
  onExpenses: (expenses: Expense[]) => void,
  onSettlements: (settlements: Settlement[]) => void,
): Unsubscribe {
  const unsubs: Unsubscribe[] = [];

  unsubs.push(
    onSnapshot(doc(db, 'groups', groupId), (snap) => {
      if (!snap.exists()) {
        onGroup(null);
        return;
      }
      const d = snap.data();
      onGroup({
        id: groupId,
        name: d.name,
        emoji: d.emoji,
        members: d.members || [],
        myMemberId: d.myMemberId,
        inviteCode: d.inviteCode,
        createdAt: d.createdAt,
      });
    }),
  );

  unsubs.push(
    onSnapshot(collection(db, 'groups', groupId, 'expenses'), (snap) => {
      onExpenses(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Expense));
    }),
  );

  unsubs.push(
    onSnapshot(collection(db, 'groups', groupId, 'settlements'), (snap) => {
      onSettlements(
        snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Settlement),
      );
    }),
  );

  return () => unsubs.forEach((u) => u());
}
