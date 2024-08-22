import { Account } from '@aws-sdk/client-organizations';
import * as config from '../config/config.js';
import { saveJsonToFile } from '../utils/index.js';
import {
  AccountIdsWithPrimaryKey,
  PermissionSetsPerAccountWithPrimaryKey,
  PermissionSetsWithPrimaryKey,
} from '../types/index.js';
import {
  assignAccountIdKeys,
  assignPermissionSetPerAccountIdKeys,
  getOrgPermissionSetsMetadata,
} from './helpers/generate-account-assignments.helpers.js';
import { AccountAssignment } from '@aws-sdk/client-sso-admin';

/*
Export a set of env variables into the terminal from SSO console login screen:

export AWS_REGION='eu-west-2'

export AWS_ACCESS_KEY_ID="blablablaj"
export AWS_SECRET_ACCESS_KEY="blablabla"
export AWS_SESSION_TOKEN="blablabla"

Then run `npm run account-assignment-script`
*/

const listAccountIds = async () => {
  const accountIdsResponse: Account[] = [];
  let currentAccountIdPage = 0;

  console.log(`\n************* Account IDs *************\n`);

  for await (const page of config.accountIdsPaginator) {
    currentAccountIdPage += 1;
    console.log(
      `Retrieving ${
        page.Accounts!.length
      } account and ids from API response page ${currentAccountIdPage}`,
    );
    accountIdsResponse.push(...page.Accounts!);
  }

  console.log(
    `Total accounts in this AWS Organization retrieved: ${accountIdsResponse.length}`,
  );

  const accountIds = accountIdsResponse?.reduce(
    assignAccountIdKeys,
    {} as AccountIdsWithPrimaryKey,
  ) as AccountIdsWithPrimaryKey;

  await saveJsonToFile(
    `${config.JSON_OUTPUT_FOLDER}/accountIds.json`,
    accountIds,
  );
  return accountIds;
};

const listPermissionSetsPerAccount = async (
  accountIds: AccountIdsWithPrimaryKey,
  orgPermissionSetsNames: PermissionSetsWithPrimaryKey,
) => {
  console.log(`\n************* Permission Sets per Account *************\n`);

  // create array of accountIds
  const accountIdsArray = Object.keys(accountIds);

  // loop through all accounts to extract permission sets associated per account
  const permissionSetsPerAccount = await Promise.all(
    accountIdsArray.map(async (accountId) => {
      // wrapper function needed to pass in dynamic account ID
      const permissionSetPerAccountPaginator =
        config.createPermissionSetPerAccountPaginator(accountId);

      const permissionSetPerAccountResponse: string[] = [];
      let currentPermissionSetPerAccountPage = 0;

      for await (const page of permissionSetPerAccountPaginator) {
        currentPermissionSetPerAccountPage += 1;
        console.log(
          `Retrieving ${page.PermissionSets!.length} permission sets from ${
            accountIds[accountId].Name
          } group on API response page ${currentPermissionSetPerAccountPage}`,
        );
        permissionSetPerAccountResponse.push(...page.PermissionSets!);
      }

      // convert the arn in the full permission set object with name
      const permissionSets = permissionSetPerAccountResponse.map(
        (permissionSetsArnOnly) => {
          return orgPermissionSetsNames[permissionSetsArnOnly];
        },
      );

      const permissonSetPerAccount = { [accountId]: permissionSets };

      return permissonSetPerAccount;
    }),
  );

  // as usual, make the account id the primary key for the permission sets associated with the account
  const permissionSetsPerAccountIdKeys = permissionSetsPerAccount?.reduce(
    assignPermissionSetPerAccountIdKeys,
    {} as PermissionSetsPerAccountWithPrimaryKey,
  );

  await saveJsonToFile(
    `${config.JSON_OUTPUT_FOLDER}/permissionSetsPerAccount.json`,
    permissionSetsPerAccountIdKeys,
  );

  return permissionSetsPerAccountIdKeys;
};

const listAccountAssignments = async (
  accountIds: AccountIdsWithPrimaryKey,
  permissionSetsPerAccount: PermissionSetsPerAccountWithPrimaryKey,
) => {
  console.log(`\n************* Account Assignments *************\n`);

  // create array of accountIds
  const accountIdsArray = Object.keys(permissionSetsPerAccount);

  const accountAssignments = await Promise.all(
    accountIdsArray.map(async (accountId) => {
      // This is the array of permission sets on the current account
      const currentAccountPermissionSets = permissionSetsPerAccount[accountId];

      // Per permission set, retrieve the principle information
      const assignedPrinciplesPerPermissionSet = await Promise.all(
        currentAccountPermissionSets.map(async (permissionSet) => {
          // wrapper function needed to pass in dynamic account ID and permission set ID
          const accountAssignmentsPaginator =
            config.createAccountAssignmentPaginator(
              accountId,
              permissionSet.PermissionSetArn as string,
            );

          const accountAssingmentsResponse: AccountAssignment[] = [];
          let currentAccountAssignmentPage = 0;

          for await (const page of accountAssignmentsPaginator) {
            currentAccountAssignmentPage += 1;
            console.log(
              `Retrieving ${accountIds[accountId].Name} account assignments on API response page ${currentAccountAssignmentPage}`,
            );
            accountAssingmentsResponse.push(...page.AccountAssignments!);
          }

          return accountAssingmentsResponse;
        }),
      );
      return assignedPrinciplesPerPermissionSet;
    }),
  );

  await saveJsonToFile(
    `${config.JSON_OUTPUT_FOLDER}/accountAssignments.json`,
    accountAssignments,
  );
  return accountAssignments;
};

// get all the account Ids in the org
const accountIds = await listAccountIds();

//Get the metadata of the permission sets used in the org
const orgPermissionSetsNames = await getOrgPermissionSetsMetadata();

// Get the permission sets per account. Loop through account Ids, then map over the permission set arns and add the metadata
const permissionSetsPerAccount = await listPermissionSetsPerAccount(
  accountIds,
  orgPermissionSetsNames,
);

// Now finally get the principles associated with the permission sets per account
await listAccountAssignments(accountIds, permissionSetsPerAccount);
