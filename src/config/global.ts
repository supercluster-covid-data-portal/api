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

const getAppConfig: () => AppConfig = () => ({
  auth: {
    apiRootUrl: process.env.AUTH_API_ROOT || 'http://localhost:8080',
    jwksUri: process.env.JWKS_URI || '',
    clientId: process.env.AUTH_CLIENT_ID || '',
    clientSecret: process.env.AUTH_CLIENT_SECRET || '',
    sessionDuration: Number(process.env.AUTH_SESSION_DURATION) || 1800000,
    sessionTokenKey: process.env.AUTH_SESSION_TOKEN_KEY || '',
  },
  ui: {
    rootUrl: process.env.UI_ROOT_URL || 'http://localhost:3000',
  },
});

export default getAppConfig;
