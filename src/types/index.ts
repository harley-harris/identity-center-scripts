import { User, Group } from '@aws-sdk/client-identitystore';
import { Account } from '@aws-sdk/client-organizations';
import { PermissionSet } from '@aws-sdk/client-sso-admin';

export interface UsersWithPrimaryKey {
  [key: string]: User;
  UserId: User;
}

export interface GroupsWithPrimaryKey {
  [key: string]: Group;
  GroupId: Group;
}

export interface AccountIdsWithPrimaryKey {
  [key: string]: Account;
  AccountId: Account;
}

export interface PermissionSetsWithPrimaryKey {
  [key: string]: PermissionSet;
  Arn: PermissionSet;
}

export interface PermissionSetPerAccount {
  [key: string]: PermissionSet[];
}

export interface PermissionSetsPerAccountWithPrimaryKey {
  [key: string]: PermissionSet[];
  Id: PermissionSet[];
}

export interface GroupMembershipWithNames {
  IdentityStoreId?: string;
  GroupId?: string;
  GroupDisplayName?: string;
  MemberId?: {
    UserId?: string;
    UserDisplayName?: string;
    UserName?: string;
    MembershipId?: string;
  };
}

export interface GroupMembershipAggregate {
  GroupId?: string;
  GroupDisplayName?: string;
  IdentityStoreId?: string;
  GroupUsers: {
    UserId?: string;
    UserDisplayName?: string;
    UserName?: string;
    MembershipId?: string;
  }[];
}

export interface GroupMembershipsWithPrimaryKey {
  [key: string]: GroupMembershipAggregate;
  GroupId: GroupMembershipAggregate;
}
