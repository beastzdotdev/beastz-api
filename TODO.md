

TODO PKCE add in both backend and frontend
 https://developers.onelogin.com/blog/pkce-dust-react-app,
 https://developer.okta.com/blog/2019/08/22/okta-authjs-pkce
 https://auth0.com/blog/oauth2-implicit-grant-and-spa/


- 1 day
TODO visual addition to all authentication get requests for success and failure (even for dto errors)
TODO add beautifull ui for email (I think mailgun has templates research on their admin)

- 3 hour
TODO Make method where you Blacklist all refresh Token and send event on socket to force log out and delete all token on frontend

- 2 days
TODO add all kind of e2e testing

- 3 hour
TODO use soft delete middleware and remove all includeDeleted middleware
TODO Index necessary fields in prisma

- 1 hour
TODO Move to swc

- ?
TODO Used Docker for Postgres and Redis

- end
TODO  Enable x-forwarded-for (proxy_set_header X-Forwarded-For $remote_addr)
      https://stackoverflow.com/questions/8107856/how-to-determine-a-users-ip-address-in-node
TODO Implemetnt free logger monitoring service and use winston maybe ??
TODO Basic throttle (after docker redis implemented use throttle for redis and after deployment)