/*
 * Copyright (c) 2021 The Ontario Institute for Cancer Research. All rights reserved
 *
 * This program and the accompanying materials are made available under the terms of
 * the GNU Affero General Public License v3.0. You should have received a copy of the
 * GNU Affero General Public License along with this program.
 *  If not, see <http://www.gnu.org/licenses/>.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
 * SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
 * IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import * as dotenv from 'dotenv';
import urlJoin from 'url-join';
import { JWKS_ENDPOINT } from '../constants/endpoint';
import logger from '../logger';
import * as vault from './vault';

interface AppConfig {
  auth: {
    apiRootUrl: string;
    jwksUri: string;
    clientId: string;
    clientSecret: string;
    sessionDuration: number;
    sessionTokenKey: string;
  };
  ui: {
    rootUrl: string;
  };
}
let config: AppConfig | undefined = undefined;

const loadVaultSecrets = async () => {
  const vaultEnabled = process.env.VAULT_ENABLED === 'true';
  let secrets: any = {};

  /** Vault */
  if (vaultEnabled) {
    if (process.env.VAULT_ENABLED && process.env.VAULT_ENABLED === 'true') {
      if (!process.env.VAULT_SECRETS_PATH) {
        logger.error('Path to secrets not specified but vault is enabled');
        throw new Error('Path to secrets not specified but vault is enabled');
      }
      try {
        secrets = await vault.loadSecret(process.env.VAULT_SECRETS_PATH);
      } catch (err) {
        logger.error('Failed to load secrets from vault.');
        throw new Error('Failed to load secrets from vault.');
      }
    }
  }
  return secrets;
};

const buildAppConfig = async (secrets: any): Promise<AppConfig> => {
  logger.info('Building app config...');
  config = {
    auth: {
      apiRootUrl: process.env.AUTH_API_ROOT || 'http://localhost:4000',
      jwksUri: process.env.AUTH_API_ROOT ? urlJoin(process.env.AUTH_API_ROOT, JWKS_ENDPOINT) : '',
      clientId: process.env.AUTH_CLIENT_ID || '',
      clientSecret: secrets.AUTH_CLIENT_SECRET || process.env.AUTH_CLIENT_SECRET || '',
      sessionDuration: Number(process.env.AUTH_SESSION_DURATION) || 1800000,
      sessionTokenKey: process.env.AUTH_SESSION_TOKEN_KEY || '',
    },
    ui: {
      rootUrl: process.env.UI_ROOT_URL || 'http://localhost:3000',
    },
  };
  return config;
};

const getAppConfig = async (envFile?: string): Promise<AppConfig> => {
  if (config != undefined) {
    return config;
  }
  if (envFile) {
    dotenv.config({
      path: envFile,
    });
  } else {
    dotenv.config();
  }
  const secrets = await loadVaultSecrets();
  return buildAppConfig(secrets);
};

export default getAppConfig;
