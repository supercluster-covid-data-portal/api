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
import { URL } from 'url';

import getAppConfig from '../../config/global';
import logger from '../../logger';
import { extractUser, fetchAuthToken, fetchUserInfo } from './auth.service';

const router: Router = Router();

router.post('/token', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;

    if (code) {
      const tokens = await fetchAuthToken(code);
      const config = getAppConfig();
      const domain = new URL(config.client.domain);

      const cookieConfig: CookieOptions = {
        domain: domain.hostname,
        maxAge: config.auth.sessionDuration,
        path: '/',
        sameSite: 'strict',
        secure: true,
      };

      // attach jwt as cookie - this will become a session id
      res.cookie(config.auth.sessionTokenKey, tokens.accessToken, cookieConfig);

      // return userInfo in the response
      const userInfo = extractUser(jwtDecode(tokens.idToken));

      return res.status(200).send(userInfo);
    }

    return res.status(400).send('Missing parameters');
  } catch (error) {
    if (error instanceof Error) {
      logger.debug(`Could not retrieve token: ${error.message}`);
    }
    return res.status(500).send('Login failed');
  }
});

router.get('/user-info', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = getAppConfig();
    const token = req.cookies[config.auth.sessionTokenKey];

    if (token) {
      const user = await fetchUserInfo(token);

      return res.status(200).send(user);
    }

    return res.status(401).send('Please login');
  } catch (error) {
    if (error instanceof Error) {
      logger.debug(`Could not get user info: `, error);
    }
    return next(error);
  }
});

export default router;
