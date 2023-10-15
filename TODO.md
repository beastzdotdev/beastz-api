

TODO More security
========================================================
TODO PKCE add in both backend and frontend
 https://developers.onelogin.com/blog/pkce-dust-react-app,
 https://developer.okta.com/blog/2019/08/22/okta-authjs-pkce
 https://auth0.com/blog/oauth2-implicit-grant-and-spa/


TODO Implement https://www.dicebear.com/ for profile image path


TODO do everything in authentication as transaction
TODO add global logger to see all kinds of logs
TODO Implemetnt free logger monitoring service and use winston maybe ??

TODO visual addition to all authentication get requests for success and failure (even for dto errors)
TODO add beautifull ui for email (I think mailgun has templates research on their admin)

TODO Enable x-forwarded-for (proxy_set_header X-Forwarded-For $remote_addr;)
TODO Make method where you Blacklist all refresh Token and send event on socket to force log out and delete all token on frontend
TODO Index necessary fields in prisma
TODO Finally when finished just backup this git in drive somewhere delete this todo and update email dont use main
TODO Used Docker for Postgres and Redis
TODO Basic throttle (after docker redis implemented use throttle for redis and after deployment)