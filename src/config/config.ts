import {
  IdentitystoreClient,
  paginateListGroupMemberships,
  paginateListGroups,
  paginateListUsers,
} from '@aws-sdk/client-identitystore';
import {
  SSOAdminClient,
  ProvisioningStatus,
  paginateListPermissionSetsProvisionedToAccount,
  paginateListAccountAssignments,
  paginateListPermissionSets,
} from '@aws-sdk/client-sso-admin';
import {
  OrganizationsClient,
  paginateListAccounts,
} from '@aws-sdk/client-organizations';

export const JSON_OUTPUT_FOLDER = 'output';
export const ENV_FILE = '.env';

// Identity-store client - For SSO users and groups
export const identityStoreClient = new IdentitystoreClient();
const identityStoreId = process.env.IDENTITY_STORE_ID;

export const identitystoreInput = {
  IdentityStoreId: identityStoreId,
};

export const usersPaginator = paginateListUsers(
  { client: identityStoreClient, pageSize: 100 },
  identitystoreInput,
);

export const groupsPaginator = paginateListGroups(
  { client: identityStoreClient, pageSize: 100 },
  identitystoreInput,
);

export const createGroupMembershipsPaginator = (groupId: string) =>
  paginateListGroupMemberships(
    { client: identityStoreClient, pageSize: 100 },
    { ...identitystoreInput, GroupId: groupId },
  );

// Organizations client - For account ids

export const organizationsClient = new OrganizationsClient();
export const accountIdsPaginator = paginateListAccounts(
  { client: organizationsClient, pageSize: 20 },
  {},
);

// sso-admin client - for account assignments

export const ssoAdminClient = new SSOAdminClient();
export const instanceArn = process.env.INSTANCE_ARN;

export const createPermissionSetPerAccountPaginator = (accountID: string) =>
  paginateListPermissionSetsProvisionedToAccount(
    { client: ssoAdminClient, pageSize: 100 },
    { InstanceArn: instanceArn, AccountId: accountID },
  );

export const createAccountAssignmentPaginator = (
  accountID: string,
  permissionSetArn: string,
) =>
  paginateListAccountAssignments(
    { client: ssoAdminClient, pageSize: 100 },
    {
      InstanceArn: instanceArn,
      AccountId: accountID,
      PermissionSetArn: permissionSetArn,
    },
  );

export const permissionSetsArnsPaginator = paginateListPermissionSets(
  { client: ssoAdminClient, pageSize: 100 },
  { InstanceArn: instanceArn },
);

export const describePermissionSetInput = {
  InstanceArn: instanceArn,
};
export const listPermissionSetsProvisionedToAccountInput = {
  InstanceArn: instanceArn,
  ProvisioningStatus: 'LATEST_PERMISSION_SET_PROVISIONED' as ProvisioningStatus,
  MaxResults: Number('int'),
};

export const listInstancesInput = {
  MaxResults: Number('int'),
};

export const listAccountAssignmentInput = {
  // ListAccountAssignmentsRequest
  InstanceArn: instanceArn,
};
