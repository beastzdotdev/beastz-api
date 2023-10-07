

TODO More security
========================================================
TODO PKCE add in both backend and frontend
 https://developers.onelogin.com/blog/pkce-dust-react-app,
 https://developer.okta.com/blog/2019/08/22/okta-authjs-pkce

TODO validate user locking and blocking and everything in authentication controller and routes which has no auth
TODO do everything in authentication as transaction
TODO add global logger to see all kinds of logs
TODO remove InjectEnv decorator
TODO visual addition to all authentication get requests for success and failure (even for dto errors)




TODO Blacklist User controller methods after permissions
TODO Blacklist Token controller methods after permissions

TODO Increase refresh token expiry date (look in oauth docs for strict guidlines)

TODO Return hashed jwt to frontend and make it optional from env add is_jwt_hashed and jwt_hash_secret
TODO Implemetn free logger monitoring service and use winston maybe ??
TODO Enable x-forwarded-for (proxy_set_header X-Forwarded-For $remote_addr;)
TODO Implement https://www.dicebear.com/ for profile image path
TODO Basic throttle
TODO Origin checkup for prod

TODO Index necessary fields in prisma
TODO Safe passwords fields in every dtos



TODO Implement email service mailgun
  [ ask toko for downgrading to basic plan, default will force you to pay ]
  send email for reseting password (message: we have detected credential reuse) - method refreshToken
  send password,link to user on mail - method recoverPasswordSendVerificationCode and error msg on reuse detection
  send password,link to user on mail - method sendAccountVerificationCode and error msg on reuse detection
  check everywhere use globl search for email or mail


TODO Finally when finished just backup delete this todo and update email dont use main
TODO Used Docker for Postgres and Redis