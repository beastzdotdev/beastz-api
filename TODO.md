1. [x] when user joins lock file
2. [x] when user enables collab create/update entity in db and also create/overwrite redis hash table on collab key
  a. [x] since this is http call masterSocketId must be updated in handle connection even if entity is disabled 
3. 


TODO: remove this bs refresh token saving in db and save it only one time

TODO: for dangling users in socket this can be checked by checking in memory and in redis as well



TODO i think it would be better if all transactions callback moved from services to controllers because some services are used in other services

TODO move every folder starting with user-* under name of hub or nexus

https://docs.nestjs.com/recipes/swc


TODO method validateParentRootParentStructure
  this method can be optimized by only checking existence or adding flags instead of fetching all



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


TODO i think it would be better to add copy to same name instead of increasing numbers becuase too much overhead happens

TODO rename !!!!




TODO give some limit to how many file inside folder

TODO add absolute path to each BasicFileStructure by using class-transforemr or something



TODO account delete
//TODO admin roles

//TODO upload-document-image-preview-path this endpoint could use compress library like sharp from npm written in c++
// and for example create CompressImageInterceptor and add it to interceptors array after fileInterceptors