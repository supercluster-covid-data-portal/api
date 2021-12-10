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

import jwtDecode from 'jwt-decode';
import jsonwebtoken, { Algorithm } from 'jsonwebtoken';
import JwksRsa from 'jwks-rsa';
import urlJoin from 'url-join';
import axios, { AxiosError, AxiosResponse } from 'axios';

import { TokenResponseData, WalletJwtData, WalletJwtHeaderData, WalletUser } from './types';
import getAppConfig, { getAppSecrets } from '../../config/global';
import logger from '../../logger';
import { get } from 'lodash';
import { URL } from 'url';

let kid: string;
let pubkey: string;

const fetchPublicKey: (keyId: string) => Promise<string> = async (keyId) => {
  const config = getAppConfig();
  const client = JwksRsa({
    jwksUri: config.auth.jwksUri,
  });

  const key = await client.getSigningKey(keyId);
  return key.getPublicKey();
};

// extract jwt header info to keep auth service kid + pubkey up-to-date with external authorization server settings
// returns a boolean for validity
export const validateJwt: (jwt: string) => Promise<boolean> = async (jwt) => {
  const jwtHeader: WalletJwtHeaderData = jwtDecode(jwt, { header: true }); // header: true will return ONLY header info
  const kidFromJwt = jwtHeader.kid;
  const alg = jwtHeader.alg;

  // if existing kid does not match incoming from jwt, update
  if (kidFromJwt !== kid) {
    logger.debug('Resetting kid from jwt...');
    const newPubKey = await fetchPublicKey(kidFromJwt); // need error handling
    kid = kidFromJwt;
    pubkey = newPubKey;
  }

  return verifyJwt(pubkey, jwt, alg);
};

// verify jwt against auth service public key
const verifyJwt: (jwtString: string, publicKey: string, alg: Algorithm) => boolean = (
  publicKey,
  jwtString,
  alg,
) => {
  try {
    if (!jwtString || !publicKey) {
      return false;
    } else {
      return !!jsonwebtoken.verify(jwtString, publicKey, { algorithms: [alg] });
    }
  } catch (err) {
    return false;
  }
};

export const extractUser: (jwtData: WalletJwtData) => WalletUser = (jwtData) => {
  return {
    name: jwtData.name || '',
    email: jwtData.email || '',
    id: jwtData.sub || '',
  };
};

export const fetchAuthToken = async (
  authCode: string,
): Promise<{ idToken: string; accessToken: string }> => {
  const config = getAppConfig();
  const secrets = await getAppSecrets();
  const credentials = `${config.auth.clientId}:${secrets?.auth.clientSecret}`;
  const loginUrl = new URL(urlJoin(config.auth.apiRootUrl, 'oauth/token'));
  loginUrl.searchParams.append('grant_type', 'authorization_code');
  loginUrl.searchParams.append('code', authCode);

  const encoded = Buffer.from(credentials).toString('base64');

  const tokenResponse: TokenResponseData = await axios
    .post(
      loginUrl.href,
      {},
      {
        headers: {
          Authorization: `Basic ${encoded}`,
        },
      },
    )
    .then(async (res: AxiosResponse<any, any>) => {
      if (res.status === 200) {
        return res.data;
      }
      throw new Error(`Auth token response is not OK: ${res.status}`);
    })
    .catch((error: AxiosError) => {
      logger.debug('Token fetch failed, unable to login.');
      throw error;
    });

  const idToken = tokenResponse.id_token;
  const accessToken = tokenResponse.access_token;
  const validIdToken = await validateJwt(idToken);
  const validAccessToken = await validateJwt(accessToken);

  if (!(validIdToken && validAccessToken)) {
    throw new Error('Invalid JWT!!');
  }

  return { idToken, accessToken };
};

// authenticated fetch for user data from userinfo endpoint
export const fetchUserInfo = async (token: string) => {
  const config = getAppConfig();
  const userResult = await axios
    .get(urlJoin(config.auth.apiRootUrl, 'api/v1/users/me'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res: AxiosResponse) => {
      // response is always 200, but returns authenticated: false if auth is not present/is expired
      if (res.data.authenticated) {
        if (res.data.user) {
          const { user } = res.data;
          return {
            name: user.fullname || '',
            // if email will be used in frontend, likely better to specify by issuer
            email: Array.isArray(user.linkedAccounts) && get(user, 'linkedAccounts[0].email', ''),
            id: user.id || '',
          } as WalletUser;
        }
        throw new Error('Invalid user info response');
      }
      throw new Error('Not authenticated, cannot fetch user info');
    })
    .catch((err: AxiosError) => {
      logger.debug('Error fetching user info');
      return err;
    });

  return userResult;
};
