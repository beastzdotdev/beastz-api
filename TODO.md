File versioning

TODO user settings will be saved in many to one where {user_id, settings_key: varchar, settings_value: BSON}



TODO PKCE add in both backend and frontend
 https://developers.onelogin.com/blog/pkce-dust-react-app,
 https://developer.okta.com/blog/2019/08/22/okta-authjs-pkce
 https://auth0.com/blog/oauth2-implicit-grant-and-spa/

CSRF protection
Hash auth sending tokens


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
TODO Implemetnt free logger monitoring service and use winston maybe, newrelic, prometheus, grafana, datadog ??
TODO Basic throttle (after docker redis implemented use throttle for redis and after deployment)

TODO add beautifull ui for email (I think mailgun has templates research on their admin)
TODO visual improvement to all authentication get requests for success and failure (even for dto errors)




TODO  every image or file request will have its own cookies and will be shown only to authorized users
      will not be public basically

      secure static assets
      https://stackoverflow.com/questions/21335868/how-to-protect-static-folder-in-express-with-passport

TODO test out file upload method on file name check but with parent




TODO add prometheus for prisma metrics and jaeger for prisma tracing on top of docker





TODO needs secutiry on all static assets
TODO sort inside loader folder and specific files