

TODO More security
========================================================
TODO PKCE add in both backend and frontend
 https://developers.onelogin.com/blog/pkce-dust-react-app,
 https://developer.okta.com/blog/2019/08/22/okta-authjs-pkce


TODO Return hashed jwt to frontend and make it optional from env add is_jwt_hashed and jwt_hash_secret
TODO Implement https://www.dicebear.com/ for profile image path


TODO do everything in authentication as transaction
TODO Increase refresh token expiry date (look in oauth docs for strict guidlines)

TODO visual addition to all authentication get requests for success and failure (even for dto errors)
TODO add global logger to see all kinds of logs
TODO Implemetn free logger monitoring service and use winston maybe ??
TODO Enable x-forwarded-for (proxy_set_header X-Forwarded-For $remote_addr;)

TODO Implement email service mailgun
  [ ask toko for downgrading to basic plan, default will force you to pay ]
  send email for reseting password (message: we have detected credential reuse) - method refreshToken
  send password,link to user on mail - method recoverPasswordSendVerificationCode and error msg on reuse detection
  send password,link to user on mail - method sendAccountVerificationCode and error msg on reuse detection
  check everywhere use globl search for email or mail

TODO Make method where you Blacklist all refresh Token and send event on socket to force log out and delete all token on frontend


TODO Index necessary fields in prisma
TODO Finally when finished just backup this git in drive somewhere delete this todo and update email dont use main
TODO Used Docker for Postgres and Redis
TODO Basic throttle (after docker redis implemented use throttle for redis and after deployment)