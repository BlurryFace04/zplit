import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Group, Expense, Settlement, Member } from '../types';
import { getDeviceId } from '../lib/deviceId';
import {
  createGroupInFirestore,
  deleteGroupInFirestore,
  addExpenseInFirestore,
  updateExpenseInFirestore,
  deleteExpenseInFirestore,
  addSettlementInFirestore,
  deleteSettlementInFirestore,
  updateMemberZecAddressInFirestore,
  updateMemberProfileInFirestore,
  lookupInviteCode,
  joinGroupInFirestore,
  subscribeToGroup,
} from '../lib/firestore';
import type { Unsubscribe } from 'firebase/firestore';

interface AppState {
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  userName: string;
  userZecAddress: string;
  myGroupIds: string[];
  loading: boolean;

  setUserName: (name: string) => void;
  setUserZecAddress: (address: string) => void;
  syncProfileToGroups: () => Promise<void>;

  addGroup: (name: string, emoji: string, otherMembers: Omit<Member, 'id'>[]) => Promise<string>;
  deleteGroup: (id: string) => Promise<void>;
  updateMemberZecAddress: (groupId: string, memberId: string, address: string) => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  editExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (groupId: string, id: string) => Promise<void>;

  addSettlement: (settlement: Omit<Settlement, 'id' | 'createdAt'>) => Promise<void>;
  deleteSettlement: (groupId: string, id: string) => Promise<void>;

  joinGroupByCode: (code: string) => Promise<{ groupId: string; groupName: string } | null>;

  initSubscriptions: () => () => void;
}

const unsubs = new Map<string, Unsubscribe>();

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      groups: [],
      expenses: [],
      settlements: [],
      userName: '',
      userZecAddress: '',
      myGroupIds: [],
      loading: false,

      setUserName: (name) => set({ userName: name }),
      setUserZecAddress: (address) => set({ userZecAddress: address }),

      syncProfileToGroups: async () => {
        const state = get();
        const updates: { name: string; zecAddress?: string } = {
          name: state.userName,
        };
        if (state.userZecAddress) {
          updates.zecAddress = state.userZecAddress;
        }

        const promises = state.groups
          .filter((g) => g.myMemberId)
          .map((g) =>
            updateMemberProfileInFirestore(g.id, g.myMemberId, updates)
          );

        await Promise.all(promises);
      },

      addGroup: async (name, emoji, otherMembers) => {
        const id = uuidv4();
        const myId = uuidv4();
        const state = get();
        const deviceId = getDeviceId();

        const myMember: Member = {
          id: myId,
          name: state.userName || 'You',
          ...(state.userZecAddress ? { zecAddress: state.userZecAddress } : {}),
          isMe: true,
        };

        const group: Group = {
          id,
          name,
          emoji,
          members: [
            { ...myMember, deviceId } as Member & { deviceId: string },
            ...otherMembers.map((m) => ({ ...m, id: uuidv4() })),
          ] as Member[],
          myMemberId: myId,
          createdAt: new Date().toISOString(),
        };

        const inviteCode = await createGroupInFirestore(group);

        set((state) => ({
          groups: [{ ...group, inviteCode }, ...state.groups],
          myGroupIds: [id, ...state.myGroupIds],
        }));

        const store = get();
        subscribeToSingleGroup(id, set, store);

        return id;
      },

      deleteGroup: async (id) => {
        await deleteGroupInFirestore(id);
        const unsub = unsubs.get(id);
        if (unsub) {
          unsub();
          unsubs.delete(id);
        }
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
          expenses: state.expenses.filter((e) => e.groupId !== id),
          settlements: state.settlements.filter((s) => s.groupId !== id),
          myGroupIds: state.myGroupIds.filter((gid) => gid !== id),
        }));
      },

      updateMemberZecAddress: async (groupId, memberId, address) => {
        await updateMemberZecAddressInFirestore(groupId, memberId, address);
      },

      addExpense: async (expense) => {
        const newExpense: Expense = {
          ...expense,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        await addExpenseInFirestore(newExpense);
      },

      editExpense: async (expense) => {
        await updateExpenseInFirestore(expense);
      },

      deleteExpense: async (groupId, id) => {
        await deleteExpenseInFirestore(groupId, id);
      },

      addSettlement: async (settlement) => {
        const newSettlement: Settlement = {
          ...settlement,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        await addSettlementInFirestore(newSettlement);
      },

      deleteSettlement: async (groupId, id) => {
        await deleteSettlementInFirestore(groupId, id);
      },

      joinGroupByCode: async (code) => {
        const result = await lookupInviteCode(code);
        if (!result) return null;

        const state = get();
        const deviceId = getDeviceId();

        if (state.myGroupIds.includes(result.groupId)) {
          return { groupId: result.groupId, groupName: result.group.name };
        }

        const myId = uuidv4();
        const me: Member & { deviceId: string } = {
          id: myId,
          name: state.userName || 'You',
          ...(state.userZecAddress ? { zecAddress: state.userZecAddress } : {}),
          isMe: true,
          deviceId,
        };

        await joinGroupInFirestore(result.groupId, me);

        const groupWithMyId: Group = {
          ...result.group,
          myMemberId: myId,
          members: [...result.group.members, me],
        };

        set((state) => ({
          groups: [groupWithMyId, ...state.groups],
          myGroupIds: [result.groupId, ...state.myGroupIds],
        }));

        subscribeToSingleGroup(result.groupId, set, get());

        return { groupId: result.groupId, groupName: result.group.name };
      },

      initSubscriptions: () => {
        const state = get();
        for (const groupId of state.myGroupIds) {
          subscribeToSingleGroup(groupId, set, state);
        }
        return () => {
          unsubs.forEach((u) => u());
          unsubs.clear();
        };
      },
    }),
    {
      name: 'zplit-storage',
      partialize: (state) => ({
        userName: state.userName,
        userZecAddress: state.userZecAddress,
        myGroupIds: state.myGroupIds,
        groups: state.groups,
        expenses: state.expenses,
        settlements: state.settlements,
      }),
    }
  )
);

function subscribeToSingleGroup(
  groupId: string,
  set: (fn: (state: AppState) => Partial<AppState>) => void,
  state: AppState,
) {
  if (unsubs.has(groupId)) return;

  const myMemberIdForGroup = state.groups.find((g) => g.id === groupId)?.myMemberId;

  const unsub = subscribeToGroup(
    groupId,
    (group) => {
      if (!group) return;
      set((s) => ({
        groups: s.groups.some((g) => g.id === groupId)
          ? s.groups.map((g) =>
              g.id === groupId
                ? { ...group, myMemberId: g.myMemberId }
                : g
            )
          : [...s.groups, { ...group, myMemberId: myMemberIdForGroup || group.myMemberId }],
      }));
    },
    (expenses) => {
      set((s) => ({
        expenses: [
          ...s.expenses.filter((e) => e.groupId !== groupId),
          ...expenses,
        ],
      }));
    },
    (settlements) => {
      set((s) => ({
        settlements: [
          ...s.settlements.filter((st) => st.groupId !== groupId),
          ...settlements,
        ],
      }));
    },
  );

  unsubs.set(groupId, unsub);
}
