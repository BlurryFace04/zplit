export interface Member {
  id: string;
  name: string;
  zecAddress?: string;
  isMe?: boolean;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  date: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  members: Member[];
  myMemberId: string;
  inviteCode?: string;
  createdAt: string;
}

export interface Balance {
  memberId: string;
  memberName: string;
  amount: number;
  isMe?: boolean;
}

export interface DebtEdge {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}
