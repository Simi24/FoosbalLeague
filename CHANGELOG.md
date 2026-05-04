# Changelog

## [0.18.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.17.0...foosball-league-v0.18.0) (2026-05-04)


### Features

* implement custom domain support with Cloudflare for API and frontend ([a68c71e](https://github.com/Simi24/FoosbalLeague/commit/a68c71e4880e1a4bd30fb0d3c56647c0a43022aa))

## [0.17.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.16.0...foosball-league-v0.17.0) (2026-04-24)


### Features

* player insights + mobile profile polish ([b07e83f](https://github.com/Simi24/FoosbalLeague/commit/b07e83f7089aa82f35c1bec9a90f1f05e6a8dfa7))

## [0.16.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.15.1...foosball-league-v0.16.0) (2026-04-21)


### Features

* in-app notifications with polling drawer ([5889d17](https://github.com/Simi24/FoosbalLeague/commit/5889d177f3a9a72096fb0603d71b6d2ecfec0652))
* refactor fe ([f86f238](https://github.com/Simi24/FoosbalLeague/commit/f86f238cf8bbbfe2d829f15e53b8c8f09bc97bb6))

## [0.15.1](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.15.0...foosball-league-v0.15.1) (2026-04-20)


### Bug Fixes

* fixed record match button in mobile view. ([7500869](https://github.com/Simi24/FoosbalLeague/commit/750086994a393e98face74f133167ba00a6235bf))

## [0.15.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.14.0...foosball-league-v0.15.0) (2026-04-17)


### Features

* **match:** slot-driven match creation with search, rematch, and tests ([0c5db37](https://github.com/Simi24/FoosbalLeague/commit/0c5db378abeb9d11ff3fb9e9b8a0e365fe86ae19))
* mount claude code in devcontainer ([102071a](https://github.com/Simi24/FoosbalLeague/commit/102071ac56361448b2940a249406fd4546f1e77d))

## [0.14.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.13.1...foosball-league-v0.14.0) (2026-03-30)


### Features

* allow losing team players to confirm match results ([1fd9a12](https://github.com/Simi24/FoosbalLeague/commit/1fd9a126f07a55f1a96eb4347b8aa46051f52ca6))

## [0.13.1](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.13.0...foosball-league-v0.13.1) (2026-03-26)


### Bug Fixes

* ensure changelog.json is included in frontend deploy ([4608f88](https://github.com/Simi24/FoosbalLeague/commit/4608f885353484ebd0c6c3a35b936f6d7c7ffdf6))

## [0.13.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.12.1...foosball-league-v0.13.0) (2026-03-26)


### Features

* add recent matches section to player profile ([d04cd4e](https://github.com/Simi24/FoosbalLeague/commit/d04cd4e0c16f98adde58a07992199df04836fd52))


### Bug Fixes

* add symlink setup for Claude Code plugin paths in dev environment ([8712235](https://github.com/Simi24/FoosbalLeague/commit/87122353b634afb83f3d9b3b4312b54eb84dba02))

## [0.12.1](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.12.0...foosball-league-v0.12.1) (2026-03-25)


### Bug Fixes

* disable Gemini thinking tokens and use file-based JSON parsing ([f5083b2](https://github.com/Simi24/FoosbalLeague/commit/f5083b2a76169374bd739b9406822fff72fcdf34))

## [0.12.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.11.2...foosball-league-v0.12.0) (2026-03-25)


### Features

* enhance ChangelogPage to group entries by major and minor versions ([b72237e](https://github.com/Simi24/FoosbalLeague/commit/b72237e8d4be859813b10bf8254ac80c23ec8b17))


### Bug Fixes

* replace xargs with sed trim in changelog CI ([5ff0c96](https://github.com/Simi24/FoosbalLeague/commit/5ff0c9611dfefe9f1e958ddb8d384a3844907d74))

## [0.11.2](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.11.1...foosball-league-v0.11.2) (2026-03-25)


### Bug Fixes

* force valid JSON output from Gemini with responseMimeType ([1b8a130](https://github.com/Simi24/FoosbalLeague/commit/1b8a13078d51a7d622e5f3a23ddb225b42363e3f))
* update changelog.json with proper entries for 0.11.0, 0.10.0, 0.11.1 ([db27a34](https://github.com/Simi24/FoosbalLeague/commit/db27a34d110a4087c7cf8fa560902535bf4eff21))

## [0.11.1](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.11.0...foosball-league-v0.11.1) (2026-03-25)


### Bug Fixes

* use file-based prompt building for Gemini API call in changelog CI ([0c34f2e](https://github.com/Simi24/FoosbalLeague/commit/0c34f2e98aa00a6d721dc11fb25cea63bd153e3b))
* use X-goog-api-key header and gemini-flash-latest model ([35d529d](https://github.com/Simi24/FoosbalLeague/commit/35d529da0e3d06300a0fdf98cd699e2a174b1741))

## [0.11.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.10.0...foosball-league-v0.11.0) (2026-03-25)


### Features

* add landing page, ELO explanation, changelog system, and CI automation ([05b93ef](https://github.com/Simi24/FoosbalLeague/commit/05b93ef739531432d24f4e69281907b3578cdca9))

## [0.10.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.9.5...foosball-league-v0.10.0) (2026-03-24)


### Features

* allow opponents to confirm/dispute pending matches ([b9897ea](https://github.com/Simi24/FoosbalLeague/commit/b9897ea7f273c9c5537ed9a1d873578842135b20))
* group match history by day and sort matches most recent first ([bb984cd](https://github.com/Simi24/FoosbalLeague/commit/bb984cdfefdc335977bf27a91d4a26e8c77332c6))

## [0.9.5](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.9.4...foosball-league-v0.9.5) (2026-03-23)


### Bug Fixes

* Add unit tests for match confirmation, ELO calculations, health checks, and security ([f67bae2](https://github.com/Simi24/FoosbalLeague/commit/f67bae2147b4882536f2c4b4c7f4fa99c705d876))

## [0.9.4](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.9.3...foosball-league-v0.9.4) (2026-03-23)


### Bug Fixes

* enable state locking for all envs and reconcile log group ([5ae621e](https://github.com/Simi24/FoosbalLeague/commit/5ae621ec8edc36ade5cc45fc6bbf8309368ba54f))

## [0.9.3](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.9.2...foosball-league-v0.9.3) (2026-03-23)


### Bug Fixes

* remove import block after successful dev import ([69d163f](https://github.com/Simi24/FoosbalLeague/commit/69d163fec2ec262215553ea8d05559888e1c5e4a))

## [0.9.2](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.9.1...foosball-league-v0.9.2) (2026-03-23)


### Bug Fixes

* remove reserved concurrency to unblock dev deploy ([4e5c5b7](https://github.com/Simi24/FoosbalLeague/commit/4e5c5b789586f9d9c46109ae615a9b3621ae701d))

## [0.9.1](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.9.0...foosball-league-v0.9.1) (2026-03-23)


### Bug Fixes

* import existing CloudWatch log group to resolve deploy failure ([58c3b85](https://github.com/Simi24/FoosbalLeague/commit/58c3b8515a7af6f3bb4d1247ef9728eac11558b7))

## [0.9.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.8.0...foosball-league-v0.9.0) (2026-03-23)


### Features

* dark foosball theme with blue/red team identity and playful UI ([35486b3](https://github.com/Simi24/FoosbalLeague/commit/35486b39bbcefe18af01cd3d5f56e35cc788c180))


### Bug Fixes

* implement OWASP security audit findings across full stack ([a8e84a6](https://github.com/Simi24/FoosbalLeague/commit/a8e84a6b4df79ee2b86566b1ae59667eb60ea8d7))

## [0.8.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.7.0...foosball-league-v0.8.0) (2026-03-19)


### Features

* ⚡️ cache /leagues/my in Redux with 5-min TTL ([4c50d13](https://github.com/Simi24/FoosbalLeague/commit/4c50d136fd94e8ef97e12dd1abcf18d4e2ec85f1))
* ✨ migrate to RTK Query and add UX polish components ([def6b12](https://github.com/Simi24/FoosbalLeague/commit/def6b128e86a4f93e4ded987b1185d28c3ac44c7))

## [0.7.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.6.0...foosball-league-v0.7.0) (2026-03-17)


### Features

* ✨ enable user existence error prevention in Cognito user pool client ([8fd712b](https://github.com/Simi24/FoosbalLeague/commit/8fd712b15d5810e0ee09e20ba373c31640b21c06))
* ✨ mobile-native UX redesign with bottom tab bar and custom dropdowns ([55af855](https://github.com/Simi24/FoosbalLeague/commit/55af8555925d0b9e155645e3c45b13a02647929e))

## [0.6.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.5.0...foosball-league-v0.6.0) (2026-03-16)


### Features

* ✨ enhance layout components with responsive design and sidebar functionality ([ada1c49](https://github.com/Simi24/FoosbalLeague/commit/ada1c49dd4d99738376ba92dd832f79b23880ce1))

## [0.5.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.4.1...foosball-league-v0.5.0) (2026-03-16)


### Features

* ✨ redesign ELO history chart with gradient, bezier, tooltips ([256c8e8](https://github.com/Simi24/FoosbalLeague/commit/256c8e8530bd6cd0cb107e2fd5f08b6ee40d4843))


### Bug Fixes

* 🎨 replace dot-hover with full-area mouse tracking on ELO chart ([fc7f12e](https://github.com/Simi24/FoosbalLeague/commit/fc7f12ecf96303aa4745661bfff0ba955540ea49))

## [0.4.1](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.4.0...foosball-league-v0.4.1) (2026-03-16)


### Bug Fixes

* 🐛 add CloudFront 403 error redirect for SPA routing ([5de4a2d](https://github.com/Simi24/FoosbalLeague/commit/5de4a2d1ce7ce85c8e8c6c9c1526b26c4c1f6c7c))

## [0.4.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.3.0...foosball-league-v0.4.0) (2026-03-16)


### Features

* ✨ add forgot password flow via Cognito ([3e74137](https://github.com/Simi24/FoosbalLeague/commit/3e74137260b2b2ca2b61ead88d48112434664f53))
* ✨ add generated avatar with colored initials ([aa02f72](https://github.com/Simi24/FoosbalLeague/commit/aa02f729b18731015b99ac24db73e565a841baa8))
* ✨ password toggle, signup validation, edit display name, topbar link ([ecaecdc](https://github.com/Simi24/FoosbalLeague/commit/ecaecdc1b78b46bf80c91c44e058f59f978ee1a5))


### Bug Fixes

* 🐛 members endpoint uses RATING elo instead of stale ENROLLMENT elo ([5976191](https://github.com/Simi24/FoosbalLeague/commit/59761917f9404178518223b68d16eb371fb14eb7))
* 🔧 rewrite init-aws.sh with rich seed data and invite code ([38266da](https://github.com/Simi24/FoosbalLeague/commit/38266da75fd1cae98e2951680803f06b7254f0de))

## [0.3.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.2.5...foosball-league-v0.3.0) (2026-03-14)


### Features

* ✨ add achievement system with 10 badges and gamification ([13bb054](https://github.com/Simi24/FoosbalLeague/commit/13bb054d4134383336fe35e21944947a0f69382f))
* ✨ add dedicated Profile page, fix league visibility scoping ([77c6255](https://github.com/Simi24/FoosbalLeague/commit/77c625582338e03cab1ccfc9ade4a02c44a7b1c6))
* ✨ add league admin settings page with member management ([cbdd59b](https://github.com/Simi24/FoosbalLeague/commit/cbdd59b292b4979a6ef910ae96b66367e174b618))
* ✨ add match history page and leave league button ([50ccca4](https://github.com/Simi24/FoosbalLeague/commit/50ccca403c2c8729eb86f18a3661f2e9e0904600))
* ✨ fix match display, add confirm/dispute UI, ELO history chart, and player stats ([c4936ae](https://github.com/Simi24/FoosbalLeague/commit/c4936ae4e054089cf694d037ccd0f7ff54ab0ad8))
* ✨ redesign Record Match with two-column layout and ELO delta preview ([23e48bc](https://github.com/Simi24/FoosbalLeague/commit/23e48bc124b6b7547ada7f40541378c15c91da93))
* ✨ replace public league browsing with invite code system ([5fb56ad](https://github.com/Simi24/FoosbalLeague/commit/5fb56adcb6f34c725b63f3f99eb310efda14e9de))
* 🔒 enforce full league isolation, remove global player visibility ([3c7195d](https://github.com/Simi24/FoosbalLeague/commit/3c7195d4bee328707309a01438ff90bd83393f95))
* add integration tests and improve backend functionality ([b8b87cb](https://github.com/Simi24/FoosbalLeague/commit/b8b87cbc3a64ffbb005cf849f8ffffd3eafd8ed7))


### Bug Fixes

* 🎨 simplify stats to per-league only, remove cross-league aggregates ([087f332](https://github.com/Simi24/FoosbalLeague/commit/087f3327d220de8682f18eeb670124a1d9d54abd))
* 🐛 ensure unique invite codes and redirect after league creation ([e61bb32](https://github.com/Simi24/FoosbalLeague/commit/e61bb323592eac8347abdf2e3f3429de7efcb5c7))
* 🐛 leaderboard shows only enrolled leagues in dropdown ([97bb7e9](https://github.com/Simi24/FoosbalLeague/commit/97bb7e9b6032b441056f9eb5b25f33f0150196ea))
* 🐛 player profile defaults to most active league dynamically ([9b97fee](https://github.com/Simi24/FoosbalLeague/commit/9b97fee36562c28dd3a3c3c14e18ff79d63c6a02))
* 🐛 player profile dropdown shows only shared leagues ([f3c9ff3](https://github.com/Simi24/FoosbalLeague/commit/f3c9ff3b231a3afefb72cae09c1980fdc5e1957f))
* 🔧 add invite_code to seed leagues in init-aws.sh ([b98d2a8](https://github.com/Simi24/FoosbalLeague/commit/b98d2a8a4a9d52caecc08c621c4ecd15334effb5))

## [0.2.5](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.2.4...foosball-league-v0.2.5) (2026-03-13)


### Bug Fixes

* 🐛 add integration target to OPTIONS routes and hide init auth errors on login page ([86ad061](https://github.com/Simi24/FoosbalLeague/commit/86ad0614edadd33dae59125a29bf2ebc40d8ff1d))

## [0.2.4](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.2.3...foosball-league-v0.2.4) (2026-03-13)


### Bug Fixes

* 🐛 add OPTIONS routes without auth for CORS preflight ([50b2df5](https://github.com/Simi24/FoosbalLeague/commit/50b2df5b53af45a07cda38de1a6ed758fcb8bf9e))

## [0.2.3](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.2.2...foosball-league-v0.2.3) (2026-03-13)


### Bug Fixes

* 🐛 ignore cognito schema changes after pool creation ([e793277](https://github.com/Simi24/FoosbalLeague/commit/e793277e8de6aa8ebfb133ab8943cc7f47537329))

## [0.2.2](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.2.1...foosball-league-v0.2.2) (2026-03-13)


### Bug Fixes

* 🔧 add deploy resilience with state reconciliation and locking ([f83155e](https://github.com/Simi24/FoosbalLeague/commit/f83155e21f621562e5ab99fc15015b85d267caa7))

## [0.2.1](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.2.0...foosball-league-v0.2.1) (2026-03-13)


### Bug Fixes

* 🐛 disable buildx provenance for Lambda compatibility ([08f2146](https://github.com/Simi24/FoosbalLeague/commit/08f2146b781473595696447e1a53a40906a82380))

## [0.2.0](https://github.com/Simi24/FoosbalLeague/compare/foosball-league-v0.1.0...foosball-league-v0.2.0) (2026-03-13)


### Features

* first commit ([82bd613](https://github.com/Simi24/FoosbalLeague/commit/82bd613afce7b4cae3e06b0f64c66f6fe90d7d1c))
* refactor authentication flow and add signup functionality ([69b8c65](https://github.com/Simi24/FoosbalLeague/commit/69b8c65594ae385fa5b2d55f971bfca9484ba37d))


### Bug Fixes

* 🐛 add id-token permission to release-please workflow ([b7606df](https://github.com/Simi24/FoosbalLeague/commit/b7606df24cbb23761067acb4a2329df282563136))
