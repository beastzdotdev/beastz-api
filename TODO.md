
## TODO

TODO Used Docker for Postgres and Redis

TODO PKCE add in both backend and frontend
 https://developers.onelogin.com/blog/pkce-dust-react-app,
 https://developer.okta.com/blog/2019/08/22/okta-authjs-pkce


TODO Move web version to httpOnly/Secure cookie for csrf and xss attack
https://medium.com/lightrail/getting-token-authentication-right-in-a-stateless-single-page-application-57d0c6474e3


TODO Blacklist User
TODO Blacklist Token

TODO Increase refresh token expiry date (look in oauth docs for strict guidlines)

TODO Return hashed jwt to frontend and make it optional from env add is_jwt_hashed and jwt_hash_secret
TODO Implemetn free logger monitoring service and use winston maybe ??
TODO Enable x-forwarded-for (proxy_set_header X-Forwarded-For $remote_addr;)
TODO Implement https://www.dicebear.com/ for profile image path
TODO Basic throttle
TODO Origin checkup for prod

TODO Implement email service mailgun
  [ ask toko for downgrading to basic plan, default will force you to pay ]
  send email for reseting password (message: we have detected credential reuse) - method refreshToken
  send one time code to user on mail - method recoverPasswordSendVerificationCode
  send one time code to user on mail - method sendAccountVerificationCode


TODO Finally when finished just backup delete this todo and update email dont use main