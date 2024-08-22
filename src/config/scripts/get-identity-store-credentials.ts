import { ListInstancesCommand } from '@aws-sdk/client-sso-admin';
import * as config from '../config.js';
import { saveToFile } from '../../utils/index.js';

const getIdentityStoreCredentials = async () => {
  const command = new ListInstancesCommand(config.listInstancesInput);
  const response = (await config.ssoAdminClient.send(command)).Instances![0];

  const identityStoreCredentialsEnvFile =
    `IDENTITY_STORE_ID=${response.IdentityStoreId}\nINSTANCE_ARN=${response.InstanceArn}`.trim();

  await saveToFile(config.ENV_FILE, identityStoreCredentialsEnvFile);
};

await getIdentityStoreCredentials();
