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

import { Algorithm } from 'jsonwebtoken';

export interface TokenResponseData {
  access_token: string;
  id_token: string;
  refresh_token: string;
}

export interface WalletUser {
  email: string;
  name: string;
  id: string;
}

interface WalletAccountData {
  issuer: string;
  email: string;
  picture?: string | null;
  account_id: string;
}

export interface WalletJwtHeaderData {
  alg: Algorithm;
  kid: string;
}

export interface WalletJwtData {
  tokenKind: string;
  jti: string;
  aud: string[];
  azp: string;
  iat: number;
  exp: number;
  sub: string;
  iss: string;
  scope: string;
  fullname: string;
  accounts: WalletAccountData[];
  name: string;
  email: string;
}

export interface WalletUserInfoResponse {
  authenticated: boolean;
  user: {
    id: string;
    fullname: string;
    linkedAccounts: WalletAccountData[];
    createdAt: string;
    last_login_at: string;
  };
}
