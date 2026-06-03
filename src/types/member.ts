export interface Member {
  ownerid: number;
  ownername: string;
  owneremail: string;
  ownerphone: string;
  owneraltphone?: string;
}

export interface MemberSummary {
  ownerid: number;
  ownername: string;
}

export type GroupOption = {
  id: number;
  name: string;
  memberCount: number;
  memberIds: number[];
};

export type MemberOption = {
  ownerid: number;
  ownername: string;
  photoUrl?: string | null;
};
