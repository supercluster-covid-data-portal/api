import { Client } from '@elastic/elasticsearch';
import getAppConfig from './config/global';
import logger from './logger';

let esClient: Client;

export async function getEsClient(): Promise<Client> {
  if (esClient) {
    return esClient;
  }
  logger.info('Creating ES client.');
  const config = getAppConfig();
  // define auth for client, if set in env
  const auth =
    config.es.user && config.es.password
      ? { username: config.es.user, password: config.es.password }
      : undefined;

  esClient = new Client({
    node: config.es.host,
    auth,
  });
  await esClient.ping();
  logger.info('ES client successfully created!');
  return esClient;
}
