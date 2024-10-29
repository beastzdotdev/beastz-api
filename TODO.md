# Not in specific order

### Later Added

TODO  [src/modules/file-structure-public-share/file-structure-public-share.controller.ts] refactor needed 
      move used method in pure service and remove this code from controllers

TODO  [src/common/helper.ts] after moving every file under hub uncomment this part and 
      remove uppper solution (inside fsCustom):

```ts 
class {
  async move(fsSourcePath: string, fsDesinationPath: string): Promise<CustomFsResponse> {
    return new Promise((resolve, reject) => {
      return fs.rename(fsSourcePath, fsDesinationPath, err => {
        if (err) {
          reject({ success: false, err });
        } else {
          resolve({ success: true, err: null });
        }
      });
    });
  }
}
```

TODO  [src/filters/all-exception.filter.ts], [src/modules/authentication/guard/auth.guard.ts]
      needs some check for example can be moved to hub replace three url.starts with single one

TODO save log in database from prisma middleware or find better solution


### Old ones

TODO  remove this bs refresh token saving in db and save it only one time

TODO  for dangling users in socket this can be checked by checking in memory and in redis as well

TODO  move every folder starting with user-* under name of hub or nexus

TODO  File versioning

TODO  user settings will be saved in many to one where {user_id, settings_key: varchar, settings_value: BSON}

TODO  CSRF protection

TODO  Hash auth sending tokens

TODO  add all kind of e2e testing

TODO  use soft delete middleware and remove all includeDeleted middleware

TODO  Index necessary fields in prisma

TODO  Move to swc

TODO  Implemetnt free logger monitoring service and use winston maybe, newrelic, prometheus, grafana, datadog ??

TODO  Basic throttle (after docker redis implemented use throttle for redis and after deployment)

TODO  Finish FeedbackService, FeedbackController

TODO  add beautifull ui for email (I think mailgun has templates research on their admin)

TODO  visual improvement to all authentication get requests for success and failure (even for dto errors)

TODO  test out file upload method on file name check but with parent

TODO  add prometheus for prisma metrics and jaeger for prisma tracing on top of docker

TODO  needs secutiry on all static assets

TODO  sort inside loader folder and specific files

TODO  give some limit to how many file inside folder

TODO  add absolute path to each BasicFileStructure by using class-transforemr or something

TODO  account delete

TODO  admin roles

TODO  i think it would be better to add copy to same name instead of increasing numbers because
      too much overhead happens

TODO  upload-document-image-preview-path this endpoint could use compress library like sharp from npm written 
      in c++ and for example create CompressImageInterceptor and add it 
      to interceptors array after fileInterceptors

TODO  https://docs.nestjs.com/recipes/swc

TODO  I think it would be better if all transactions callback moved from services to controllers 
      because some services  are used in other services

TODO  method validateParentRootParentStructure
      this method can be optimized by only checking existence or adding flags instead of fetching all

TODO  PKCE add in both backend and frontend
        https://developers.onelogin.com/blog/pkce-dust-react-app,
        https://developer.okta.com/blog/2019/08/22/okta-authjs-pkce
        https://auth0.com/blog/oauth2-implicit-grant-and-spa/

TODO  Make method where you Blacklist all refresh Token and send event on socket to force log out 
      and delete all token on frontend

TODO  Enable x-forwarded-for (proxy_set_header X-Forwarded-For $remote_addr)
      https://stackoverflow.com/questions/8107856/how-to-determine-a-users-ip-address-in-node

TODO  every image or file request will have its own cookies and will be shown only to authorized users
      will not be public basically
      secure static assets
      https://stackoverflow.com/questions/21335868/how-to-protect-static-folder-in-express-with-passport


