import { Account } from '@aws-sdk/client-organizations';
import {
  AccountIdsWithPrimaryKey,
  PermissionSetPerAccount,
  PermissionSetsPerAccountWithPrimaryKey,
  PermissionSetsWithPrimaryKey,
} from '../../types/index.js';
import {
  DescribePermissionSetCommand,
  PermissionSet,
} from '@aws-sdk/client-sso-admin';
import * as config from '../../config/config.js';
import { saveJsonToFile } from '../../utils/index.js';

// List Account Ids

export const assignAccountIdKeys = (
  acc: AccountIdsWithPrimaryKey,
  accountId: Account,
) => {
  acc[accountId.Id as string] = { ...accountId };
  return acc;
};

// List Permission Sets

export const assignPermissionSetArnKeys = (
  acc: PermissionSetsWithPrimaryKey,
  permissionSet: PermissionSet,
) => {
  acc[permissionSet.PermissionSetArn as string] = { ...permissionSet };
  return acc;
};

// List Permission Sets Per Account

export const assignPermissionSetPerAccountIdKeys = (
  acc: PermissionSetsPerAccountWithPrimaryKey,
  permissionSetsPerAccount: PermissionSetPerAccount,
) => {
  // access the id by using Object.keys, there's only one key on the PermissionSetPerAccount object
  const accountId = Object.keys(permissionSetsPerAccount)[0];

  acc[accountId as string] = [...permissionSetsPerAccount[accountId]];
  return acc;
};

// Get Human readable names of Org Permission Sets
export const getOrgPermissionSetsMetadata = async () => {
  console.log(`\n************* Permission Sets Metadata *************\n`);

  const permissionSetsArnsResponse: string[] = [];
  let currentPermissionSetsArnsPage = 0;

  for await (const page of config.permissionSetsArnsPaginator) {
    currentPermissionSetsArnsPage += 1;
    console.log(
      `Retrieving ${
        page.PermissionSets!.length
      } permission sets ARNs from API response page ${currentPermissionSetsArnsPage}`,
    );
    permissionSetsArnsResponse.push(...page.PermissionSets!);
  }

  const permissionSetsWithNames = await Promise.all(
    permissionSetsArnsResponse.map(async (permissionSetArn) => {
      const describePermissionSetInput = {
        ...config.describePermissionSetInput,
        PermissionSetArn: permissionSetArn,
      };
      const command = new DescribePermissionSetCommand(
        describePermissionSetInput,
      );
      const response = (await config.ssoAdminClient.send(command))
        .PermissionSet as PermissionSet;
      console.log(`Retrieving ${response.Name} metadata!`);

      return response;
    }),
  );

  // Assign the permissionSet ARN as the primary key for easy retrieval of the permission set object
  const orgPermissionSets = permissionSetsWithNames?.reduce(
    assignPermissionSetArnKeys,
    {} as PermissionSetsWithPrimaryKey,
  );

  await saveJsonToFile(
    `${config.JSON_OUTPUT_FOLDER}/permissionSetsNames.json`,
    orgPermissionSets,
  );

  return orgPermissionSets;
};
