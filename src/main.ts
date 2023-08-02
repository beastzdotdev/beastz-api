import * as bodyParser from 'body-parser';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './modules/app.module';
import { Logger } from '@nestjs/common';
import { EnvService } from './modules/@global/env/env.service';
import { ENV_SERVICE_TOKEN } from './modules/@global/env/env.constants';
import helmet from 'helmet';

NestFactory.create<NestExpressApplication>(AppModule).then(async (app: NestExpressApplication) => {
  const envService = app.get<string, EnvService>(ENV_SERVICE_TOKEN);
  const logger = new Logger('Main logger');

  app.enableCors();
  app.enableShutdownHooks();
  app.set('trust proxy', true);
  app.use(helmet());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  await app.listen(envService.get('PORT'));

  // log misc stuff
  const apiUrl: string = await app.getUrl();
  logger.verbose(`GorillaVault api listening on --- ${apiUrl}`);
});

//TODO Implement email service mailgun
//TODO        [ ask toko for downgrading to basic plan, default will force you to pay ]
//TODO        send email for reseting password (message: we have detected credential reuse) - method refreshToken
//TODO        send one time code to user on mail - method recoverPasswordSendVerificationCode
//TODO        send one time code to user on mail - method sendAccountVerificationCode

//TODO return hashed jwt to frontend and make it optional from env add is_jwt_hashed and jwt_hash_secret
//TODO implemetn free logger monitoring service and use winston maybe ??
//TODO enable x-forwarded-for (proxy_set_header X-Forwarded-For $remote_addr;)

//TODO implement https://www.dicebear.com/ for profile image path
//TODO basic throttle
//TODO origin checkup for prod

//TODO move web version to httponly cookie for csrf and xss attack
//! https://medium.com/lightrail/getting-token-authentication-right-in-a-stateless-single-page-application-57d0c6474e3

// Available options and limitations:

// There are 2 types of options for storing your token:

// Web Storage API: which offers 2 mechanisms: sessionStorage and localStorage. Data stored here will always be available to your Javascript code and cannot be accessed from the backend. Thus you will have to manually add it to your requests in a header for example. This storage is only available to your app's domain and not to sub domains. The main difference between these 2 mechanisms is in data expiry:
// sessionStorage: Data available only for a session (until the browser or tab is closed).
// localStorage: Stores data with no expiration date, and gets cleared only through JavaScript, or clearing the Browser cache/Locally Stored Data
// Cookies: Automatically sent to your backend with the subsequent requests. Expiry and visibility to your Javascript code can be controlled. Can be available to your app's sub domains.
// You have to consider 2 aspects when designing your authentication mechanism:

// Security: An access or identity token is a sensitive information. The main types of attacks to always consider are Cross Site Scripting (XSS) and Cross Site Request Forgery (CSRF).
// Functional requirements: Should the user stay logged in when the browser is closed? How long will be his session? etc
// For security concerns, OWASP does not recommend storing sensitive data in a Web Storage. You can check their CheatSheetSeries page. You can also read this detailed article for more details.

// The reason is mainly linked to the XSS vulnerability. If your frontend is not a 100% protected against XSS attacks then a malicious code can get executed in your web page and it would have access to the token. It is very difficult to be fully XSS-proof as it can be caused by one of the Javascript librairies you use.

// Cookies on the other hand can be unaccessible to Javascript if they are set as HttpOnly. Now the problem with cookies is that they can easily make your website vulnerable to CSRF. SameSite cookies can mitigate that type of attacks. However, older versions of browsers don't support that type of cookies so other methods are available such as the use of a state variable. It is detailed in this Auth0 documentation article.

// Suggested solution:

// To safely store your token, I would recommend that you use a combination of 2 cookies as described below:

// A JWT token has the following structure: header.payload.signature

// In general a useful information is present in the payload such as the user roles (that can be used to adapt/hide parts of the UI). So it's important to keep that part available to the Javascript code.

// Once the authentication flow finished and JWT token created in the backend, the idea is to:

// Store the header.payload part in a SameSite Secure Cookie (so available only through https and still availble to the JS code)
// Store the signature part in a SameSite Secure HttpOnly Cookie
// Implement a middleware in your backend to resconstruct the JWT token from those 2 cookies and put it in the header: Authorization: Bearer your_token
// You can set an expiry for the cookies to meet your app's requirements.

// This idea was suggested and very well described in this article by Peter Locke.

// so in frontend when for example a,b,c requests are all sent and lets say b was fastest and got refresh
// immediatly when b refreshes a and c must be cancelled, then filled with new accessToken and resent
// which is implemented in this video
// But I think 2 axios instance will be needed one for refresh route and one fore all other
// https://www.youtube.com/watch?v=nI8PYZNFtac
// and this is code example
