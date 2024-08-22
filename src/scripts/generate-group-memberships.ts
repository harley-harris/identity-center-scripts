import { saveJsonToFile } from '../utils/index.js';
import * as config from '../config/config.js';
import { GroupMembership, User, Group } from '@aws-sdk/client-identitystore';
import {
  UsersWithPrimaryKey,
  GroupsWithPrimaryKey,
  GroupMembershipsWithPrimaryKey,
} from '../types/index.js';
import {
  addUsersGroupsDisplayNames,
  aggregateUsersInfoInGroups,
  assignGroupIdKeys,
  assignGroupMembershipIdKeys,
  assignUserIdKeys,
  removeEmptyArrays,
} from './helpers/generate-group-memberships.helpers.js';
import { createGroupMembershipsPaginator } from '../config/config.js';

/*
Export a set of env variables into the terminal from SSO console login screen:

export AWS_REGION='eu-west-2'

export AWS_ACCESS_KEY_ID="blablablaj"
export AWS_SECRET_ACCESS_KEY="blablabla"
export AWS_SESSION_TOKEN="blablabla"

Then run `npm run group-memberships-script`
*/

const listSsoUsers = async () => {
  const usersResponse: User[] = [];
  let currentUserPage = 0;

  console.log(`\n************* USERS *************\n`);

  for await (const page of config.usersPaginator) {
    currentUserPage += 1;
    console.log(
      `Retrieving ${
        page.Users!.length
      } users from API response page ${currentUserPage}`,
    );
    usersResponse.push(...page.Users!);
  }

  console.log(
    `Total users in Identity Centre retrieved: ${usersResponse.length}`,
  );

  // assign the userID as the primary key, for easy retrieval of user objects from users.json
  const users = usersResponse.reduce(
    assignUserIdKeys,
    {} as UsersWithPrimaryKey,
  );

  await saveJsonToFile(`${config.JSON_OUTPUT_FOLDER}/users.json`, users);
  return users;
};

const listSsoGroups = async () => {
  const groupsResponse: Group[] = [];
  let currentGroupPage = 0;

  console.log(`\n************* GROUPS *************\n`);

  for await (const page of config.groupsPaginator) {
    currentGroupPage += 1;
    console.log(
      `Retrieving ${
        page.Groups!.length
      } groups from API response page ${currentGroupPage}`,
    );
    groupsResponse.push(...page.Groups!);
  }

  console.log(
    `Total groups in Identity Centre retrieved: ${groupsResponse.length}`,
  );

  // assign the groupID as the primary key, for easy retrieval of group object
  const groups = groupsResponse.reduce(
    assignGroupIdKeys,
    {} as GroupsWithPrimaryKey,
  );

  await saveJsonToFile(`${config.JSON_OUTPUT_FOLDER}/groups.json`, groups);
  return groups;
};

const listGroupMemberships = async (
  users: UsersWithPrimaryKey,
  groups: GroupsWithPrimaryKey,
) => {
  console.log(`\n************* GROUP MEMBERSHIPS *************\n`);

  // create array of groupIds
  const groupIds = Object.keys(groups);

  // iterate through all group ids to extract the memberships of each group
  const groupMembershipsWithEmptyArrays = await Promise.all(
    groupIds.map(async (groupID) => {
      // wrapper function needed to pass in dynamic group ID
      const groupMembershipsPaginator =
        createGroupMembershipsPaginator(groupID);

      const groupMembershipsResponse: GroupMembership[] = [];
      let currentGroupMembershipPage = 0;

      for await (const page of groupMembershipsPaginator) {
        currentGroupMembershipPage += 1;
        console.log(
          `Retrieving ${page.GroupMemberships!.length} group member(s) from ${
            groups[groupID].DisplayName
          } group on API response page ${currentGroupMembershipPage}`,
        );
        groupMembershipsResponse.push(...page.GroupMemberships!);
      }

      return groupMembershipsResponse;
    }),
  );

  // Remove empty arrays, these are groups without any users in them hence no memberships
  const groupMembershipsNoEmptyArrays =
    groupMembershipsWithEmptyArrays.filter(removeEmptyArrays);

  // add user and group metadata so group membership json is easier to read
  const groupMembershipWithNames = groupMembershipsNoEmptyArrays.map(
    (groupMembership) =>
      addUsersGroupsDisplayNames(users, groups, groupMembership),
  );

  // the group membership data structure is strange, it repeats the group id, identity centre id etc for each member which bloats the json
  // This function aggregates all the user info into one GroupUsers array
  const groupMembershipsConsolidated = groupMembershipWithNames.map(
    (groupMembership) => aggregateUsersInfoInGroups(groupMembership),
  );

  // assign the GroupID as the primary key, for easy retrieval of Group Membership object
  const groupMemberships = groupMembershipsConsolidated.reduce(
    assignGroupMembershipIdKeys,
    {} as GroupMembershipsWithPrimaryKey,
  );

  await saveJsonToFile(
    `${config.JSON_OUTPUT_FOLDER}/groupMemberships.json`,
    groupMemberships,
  );
  return groupMemberships;
};

const users = await listSsoUsers();
const groups = await listSsoGroups();
await listGroupMemberships(users, groups);
