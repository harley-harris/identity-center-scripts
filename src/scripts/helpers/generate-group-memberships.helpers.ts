import { Group, GroupMembership, User } from '@aws-sdk/client-identitystore';
import {
  GroupMembershipWithNames,
  GroupMembershipAggregate,
  GroupsWithPrimaryKey,
  UsersWithPrimaryKey,
  GroupMembershipsWithPrimaryKey,
} from '../../types/index.js';

// List SSO users

export const assignUserIdKeys = (acc: UsersWithPrimaryKey, user: User) => {
  acc[user.UserId as string] = { ...user };
  return acc;
};

// List SSO groups

export const assignGroupIdKeys = (acc: GroupsWithPrimaryKey, group: Group) => {
  acc[group.GroupId as string] = { ...group };
  return acc;
};

// Group Membership

export const assignGroupMembershipIdKeys = (
  acc: GroupMembershipsWithPrimaryKey,
  groupMembership: GroupMembershipAggregate,
) => {
  acc[groupMembership.GroupId as string] = { ...groupMembership };
  return acc;
};

export const aggregateUsersInfoInGroups = (
  groupMembership: GroupMembershipWithNames[],
) => {
  const groupMembershipAggregate = groupMembership.reduce(
    (acc: GroupMembershipAggregate, group: GroupMembershipWithNames) => {
      // assign top level fields on first iteration to accumulator object
      if (!acc.GroupId) {
        acc.GroupId = group.GroupId;
        acc.GroupDisplayName = group.GroupDisplayName;
        acc.IdentityStoreId = group.IdentityStoreId;
      }

      // add each user in group info to MemberIds
      const aggregatedUserInfo = {
        UserId: group.MemberId?.UserId,
        UserDisplayName: group.MemberId?.UserDisplayName,
        UserName: group.MemberId?.UserName,
        MembershipId: group.MemberId?.MembershipId,
      };
      acc.GroupUsers.push(aggregatedUserInfo);

      return acc;
    },
    {
      GroupId: '',
      GroupDisplayName: '',
      IdentityStoreId: '',
      GroupUsers: [],
    } as GroupMembershipAggregate,
  );

  return groupMembershipAggregate;
};

export const addUsersGroupsDisplayNames = (
  users: UsersWithPrimaryKey,
  groups: GroupsWithPrimaryKey,
  groupMemberships: GroupMembership[],
): GroupMembershipWithNames[] => {
  return groupMemberships.map((groupMembership: GroupMembership) => {
    // correspond user id using the user id in group membership
    const matchingUser = users[groupMembership.MemberId?.UserId as string];

    // correspond group using the group id in group membership
    const matchingGroup = groups[groupMembership.MemberId?.UserId as string];

    // lol
    return {
      IdentityStoreId: groupMembership.IdentityStoreId,
      GroupId: groupMembership.GroupId,
      GroupDisplayName: matchingGroup?.DisplayName,
      MemberId: {
        UserId: matchingUser?.UserId,
        UserDisplayName: matchingUser?.DisplayName,
        UserName: matchingUser?.UserName,
        MembershipId: groupMembership.MembershipId,
      },
    };
  });
};

export const removeEmptyArrays = (groupMembership: GroupMembership[]) =>
  groupMembership.length !== 0;
