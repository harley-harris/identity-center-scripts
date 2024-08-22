import { AccountAssignment } from '@aws-sdk/client-sso-admin';
import {
  PermissionSetsWithPrimaryKey,
  UsersWithPrimaryKey,
  GroupsWithPrimaryKey,
  GroupMembershipsWithPrimaryKey,
  AccountIdsWithPrimaryKey,
} from '../types/index.js';
import { extractJsonFile, saveJsonToFile } from '../utils/index.js';
import * as config from '../config/config.js';

// Format Account Assignments

const formatAccountAssignments = async () => {
  const accountAssignments = (await extractJsonFile(
    './output/accountAssignments.json',
  )) as AccountAssignment[][];
  const permissionSetsNames = (await extractJsonFile(
    './output/permissionSetsNames.json',
  )) as PermissionSetsWithPrimaryKey;
  const users = (await extractJsonFile(
    './output/users.json',
  )) as UsersWithPrimaryKey;
  const groups = (await extractJsonFile(
    './output/groups.json',
  )) as GroupsWithPrimaryKey;
  const groupMemberships = (await extractJsonFile(
    './output/groupMemberships.json',
  )) as GroupMembershipsWithPrimaryKey;
  const accountIds = (await extractJsonFile(
    './output/accountIds.json',
  )) as AccountIdsWithPrimaryKey;

  const flatten = accountAssignments.flat(2);

  // TODO - make a type for this...
  const formattedAssignments: any = {};

  flatten.forEach((assignment) => {
    const accountId = assignment.AccountId as string;
    const principleId = assignment.PrincipalId as string;
    const principleType = assignment.PrincipalType as string;
    const permissionSetArn = assignment.PermissionSetArn as string;

    // create the account object if it doesn't exist
    // eslint-disable-next-line no-prototype-builtins
    if (!formattedAssignments.hasOwnProperty(accountId)) {
      formattedAssignments[accountId] = {};
    }

    formattedAssignments[accountId]['AccountName'] = accountIds[accountId].Name;
    formattedAssignments[accountId]['AccountRootEmail'] =
      accountIds[accountId].Email;
    formattedAssignments[accountId]['AccountAssignments'] = {};

    // create the principle object if it doesn't exist in the account
    if (
      // eslint-disable-next-line no-prototype-builtins
      !formattedAssignments[accountId]['AccountAssignments'].hasOwnProperty(
        principleId,
      )
    ) {
      formattedAssignments[accountId]['AccountAssignments'][principleId] = {};
      formattedAssignments[accountId]['AccountAssignments'][principleId][
        'PrincipleType'
      ] = principleType;
    }

    // add the Group metadata
    if (principleType === 'GROUP') {
      formattedAssignments[accountId]['AccountAssignments'][principleId][
        'DisplayName'
      ] = groups[principleId].DisplayName;
      formattedAssignments[accountId]['AccountAssignments'][principleId][
        'GroupId'
      ] = groups[principleId].GroupId;
      formattedAssignments[accountId]['AccountAssignments'][principleId][
        'Description'
      ] = groups[principleId].Description;

      // Only add group members if the group is not empty
      if (groupMemberships[principleId]) {
        formattedAssignments[accountId]['AccountAssignments'][principleId][
          'GroupUsers'
        ] = groupMemberships[principleId].GroupUsers;
      } else {
        formattedAssignments[accountId]['AccountAssignments'][principleId][
          'GroupUsers'
        ] = null;
      }
    }

    // add the User metadata
    if (principleType === 'USER') {
      formattedAssignments[accountId]['AccountAssignments'][principleId][
        'DisplayName'
      ] = users[principleId].DisplayName;
      formattedAssignments[accountId]['AccountAssignments'][principleId][
        'UserId'
      ] = users[principleId].UserId;
      formattedAssignments[accountId]['AccountAssignments'][principleId][
        'UserName'
      ] = users[principleId].UserName;
    }

    // create the PermissionSets array if it doesn't exist in the principle object
    if (
      !formattedAssignments[accountId]['AccountAssignments'][
        principleId // eslint-disable-next-line no-prototype-builtins
      ].hasOwnProperty('PermissionSets')
    ) {
      formattedAssignments[accountId]['AccountAssignments'][principleId][
        'PermissionSets'
      ] = [];
    }

    // add the permission set metadata
    formattedAssignments[accountId]['AccountAssignments'][principleId][
      'PermissionSets'
    ].push({
      PermissionSetArn: permissionSetArn,
      Name: permissionSetsNames[permissionSetArn].Name,
      Description: permissionSetsNames[permissionSetArn].Description,
    });
  });

  await saveJsonToFile(
    `${config.JSON_OUTPUT_FOLDER}/formattedAccountAssignments.json`,
    formattedAssignments,
  );
};

await formatAccountAssignments();
