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

import { CookieOptions, NextFunction, Request, Response, Router } from 'express';
import jwtDecode from 'jwt-decode';
import { AUTH_ENDPOINT } from '../../constants/endpoint';
import getAppConfig from '../../config/global';
import { extractUser, fetchAuthToken, fetchUserInfo } from '../services/auth.service';

export const router: Router = Router();

router.use((req: Request, res: Response, next: NextFunction) => {
  const config = getAppConfig();

  res.header('Access-Control-Allow-Origin', config.ui.rootUrl);
  res.header('Access-Control-Allow-Header', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// TODO reconfigure so AuthRouter has AUTH_ENDPOINT as base
router.post(`${AUTH_ENDPOINT}/token`, async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
    res.status(400).send('Missing parameters');
  }

  const tokens = await fetchAuthToken(code);
  if (tokens.accessToken && tokens.idToken) {
    const config = getAppConfig();
    const domain = new URL(config.ui.rootUrl as string);
    const cookieConfig: CookieOptions = {
      sameSite: 'strict',
      secure: true,
      maxAge: config.auth.sessionDuration,
      domain: domain.hostname,
      path: '/',
    };
    // attach jwt as cookie - this will become a session id
    res.cookie(config.auth.sessionTokenKey, tokens.accessToken, cookieConfig);
    // return userInfo in the response
    const userInfo = extractUser(jwtDecode(tokens.idToken));
    res.status(200).send(userInfo);
  } else {
    res.status(500).send('Login failed');
  }
});

router.get(`${AUTH_ENDPOINT}/user-info`, async (req: Request, res: Response) => {
  const config = getAppConfig();
  const token = req.cookies[config.auth.sessionTokenKey];

  if (token) {
    const user = await fetchUserInfo(token);
    res.status(200).send(user);
  } else {
    res.status(401).send('Please login');
  }
});
