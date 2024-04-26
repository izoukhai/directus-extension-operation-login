## Log in an user via Directus Flows

This extension is basically a copy of Directus' internal log in system, with far less features.
Basically, it allows you to:

- Pass an user ID
- Log in the user and insert a new session (directus_sessions) along with an activity record (directus_activity)
- Return access / refresh tokens and expire (ms)

### TODO
- [ ] Add an option to use Session driver instead of Access Token
- [ ] Integrate rate limiter? (currently impossible due to how Directus implements it, maybe a shared package could solve the issue)
