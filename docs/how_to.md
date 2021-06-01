# How-To

## Summary

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Config](#config)
  - [General config](#general-config)
  - [Per-request config](#per-request-config)
  - [Credentials](#credentials)
    - [Single-user setup](#single-user-setup)
      - [Using your username and password](#using-your-username-and-password)
      - [Using your username and a bot password:](#using-your-username-and-a-bot-password)
      - [Owner-only OAuth consumer:](#owner-only-oauth-consumer)
    - [Multi-user setup](#multi-user-setup)
  - [Bot](#bot)
  - [Maxlag](#maxlag)
- [API](#api)
  - [Label](#label)
    - [set label](#set-label)
  - [Description](#description)
    - [set description](#set-description)
  - [Alias](#alias)
    - [add aliases](#add-aliases)
    - [remove aliases](#remove-aliases)
    - [set aliases](#set-aliases)
  - [Claim](#claim)
    - [create claim](#create-claim)
      - [monolingualtext](#monolingualtext)
      - [quantity](#quantity)
      - [time](#time)
        - [precision](#precision)
        - [calendar](#calendar)
      - [globe-coordinate](#globe-coordinate)
      - [Special snaktypes](#special-snaktypes)
    - [update claim](#update-claim)
      - [find claim to update by value](#find-claim-to-update-by-value)
      - [find claim to update by claim guid](#find-claim-to-update-by-claim-guid)
      - [update rank](#update-rank)
    - [move claim](#move-claim)
      - [move a single claim](#move-a-single-claim)
      - [move all claims from an entity property](#move-all-claims-from-an-entity-property)
      - [move claims between properties of different datatypes](#move-claims-between-properties-of-different-datatypes)
    - [remove claim](#remove-claim)
  - [Qualifier](#qualifier)
    - [set qualifier](#set-qualifier)
    - [update qualifier](#update-qualifier)
    - [move qualifier](#move-qualifier)
      - [move a unique qualifier](#move-a-unique-qualifier)
      - [move all qualifiers from a property to another](#move-all-qualifiers-from-a-property-to-another)
      - [move qualifiers between properties of different datatypes](#move-qualifiers-between-properties-of-different-datatypes)
    - [remove qualifier](#remove-qualifier)
  - [Reference](#reference)
    - [set reference](#set-reference)
    - [remove reference](#remove-reference)
  - [Entity](#entity)
    - [edit entity](#edit-entity)
      - [incremental mode](#incremental-mode)
      - [reset mode](#reset-mode)
    - [create entity](#create-entity)
      - [create item](#create-item)
      - [create property](#create-property)
    - [merge entity](#merge-entity)
      - [merge item](#merge-item)
      - [merge property](#merge-property)
    - [delete entity](#delete-entity)
      - [delete item](#delete-item)
      - [delete property](#delete-property)
  - [get auth data](#get-auth-data)
- [Reconciliation](#reconciliation)
  - [matching](#matching)
    - [claim matching](#claim-matching)
    - [reference matching](#reference-matching)
  - [reconciliation modes](#reconciliation-modes)
    - [skip-on-any-value mode](#skip-on-any-value-mode)
    - [skip-on-value-match mode](#skip-on-value-match-mode)
    - [merge mode](#merge-mode)
- [Tips](#tips)
  - [How to get a claim guid](#how-to-get-a-claim-guid)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Config

### General config
If all your edits are made on the same Wikibase instance with the same credentials, simply pass it all at initialization
```js
const generalConfig = {
  // A Wikibase instance is required
  instance: 'https://www.wikidata.org',

  // The instance script path, used to find the API endpoint
  // Default: /w
  wgScriptPath: '/w',

  // One authorization mean is required (unless in anonymous mode, see below)
  credentials: {
    // either a username and password
    username: 'my-wikidata-username',
    // Optional: generate a dedicated password with tailored rights on /wiki/Special:BotPasswords
    // See the 'Credentials' paragraph below
    password: 'my-wikidata-password',

    // OR OAuth tokens
    oauth: {
      // Obtained at registration
      // https://www.mediawiki.org/wiki/OAuth/For_Developers#Registration
      consumer_key: 'your-consumer-token',
      consumer_secret: 'your-secret-token',
      // Obtained when the user authorized your service
      // see https://www.mediawiki.org/wiki/OAuth/For_Developers#Authorization
      token: 'a-user-token',
      token_secret: 'a-secret-token'
    }
  },

  // Flag to activate the 'anonymous' mode,
  // which actually isn't anonymous as it signs with your IP
  // Default: false
  anonymous: true,

  // Optional
  // See https://meta.wikimedia.org/wiki/Help:Edit_summary
  // Default: empty
  summary: 'some edit summary common to all the edits',

  // See https://www.mediawiki.org/wiki/Manual:Tags
  // Default: on Wikidata [ 'WikibaseJS-edit' ], empty for other Wikibase instances
  tags: [ 'Some general tag' ],

  // Default: `wikidata-edit/${pkg.version} (https://github.com/maxlath/wikidata-edit)`
  userAgent: 'my-project-name/v3.2.5 (https://project.website)',

  // See https://www.mediawiki.org/wiki/Manual:Bots
  // Default: false
  bot: true,

  // See https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
  // Default: 5
  maxlag: 2
}

const wbEdit = require('wikibase-edit')(generalConfig)
wbEdit.label.set({ id, language, value })
```

So if you have a local Wikibase instance installed via [`wikibase-docker`](https://github.com/wmde/wikibase-docker) with the default settings, that would look something like:
```js
const generalConfig = {
  instance: 'http://localhost:8181',
  credentials: {
    username: 'WikibaseAdmin',
    password: 'WikibaseDockerAdminPass'
  }
}

const wbEdit = require('wikibase-edit')(generalConfig)
```

### Per-request config
If you make requests to different Wikibase instances or with different credentials (typically when using different users OAuth keys), you can pass those specific configuration parameter per function call:
```js
const generalConfig = { userAgent }
const wbEdit = require('wikibase-edit')(generalConfig)
const requestConfig = {
  instance: 'https://project-915215.wikibase.farm',
  credentials: {
    // Either a username and password
    username,
    password,
    // OR
    oauth
  },

  // Default: false
  anonymous: false,

  // See https://www.mediawiki.org/wiki/Manual:Bots
  // Default: false
  bot: true,

  // See https://meta.wikimedia.org/wiki/Help:Edit_summary
  // Default: empty
  summary: 'some request specific edit summary',

  // An id for the last known revision that can be passed per request so that the server can detect edit collisions
  // That id can be found in any edit response as `lastrevid`
  // See https://www.mediawiki.org/wiki/Wikibase/API#Request_Format
  baserevid: 1234,

  // See https://www.mediawiki.org/wiki/Manual:Tags
  // Default: on Wikidata [ 'WikibaseJS-edit' ], empty for other Wikibase instances
  tags: [ 'Some edit specific tag' ],

  // See https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
  // Default: 5
  maxlag: 5
}
wbEdit.label.set({ id, language, value }, requestConfig)
```

Rules:
* All parameters can either be set in `generalConfig` or `requestConfig`

### Credentials
#### Single-user setup

Different options are available to authentify your requests as a single user. (That's typically what you need unless you are building a web service where multiple users would be making edits in their name. If you are building this kind of web service, see [Multi-user setup](#multi-user-setup)).

##### Using your username and password
* That's the least secured way to do it but perfectly fine for prototyping on your local Wikibase instance
* :warning: This method is using the [`API:Login` endpoint](https://www.mediawiki.org/wiki/API:Login), which has been deprecated for a while: for a safer and more long term solution, prefer using an Owner-only OAuth consumer (see below)
* Your [config object](#general-config) would then look something like:
  ```js
  const generalConfig = {
    instance: 'http://localhost:8181',
    credentials: {
      username: 'TestWikibaseUser',
      password: 'TestWikibaseUserPassword'
    }
  }
  ```

##### Using your username and a bot password:
* Any user (not just [bot accounts](https://www.wikidata.org/wiki/Wikidata:Bots) despite the name) can generate passwords with restricted rights. Recommanded grants:
  * `Edit existing pages`
  * `Delete pages, revisions, and log entries` (Optional, required by `wbEdit.entity.delete`)
* :warning: This method is also using the [`API:Login` endpoint](https://www.mediawiki.org/wiki/API:Login), which has been deprecated for a while: for a more long term solution, prefer using an Owner-only OAuth consumer (see below)
* Your [config object](#general-config) would then look something like:
  ```js
  const generalConfig = {
    instance: 'https://www.somewikibase.instance',
    credentials: {
      username: 'MyUsername',
      password: 'password_name@jkvbxgq9xiu16yb8vgzjp4gtd6m258os'
    }
  }
  ```

##### [Owner-only OAuth consumer](https://www.mediawiki.org/wiki/OAuth/Owner-only_consumers):
* Can be created without the validation of an administrator on `/wiki/Special:OAuthConsumerRegistration/propose?wpownerOnly=1`, but **not all users have the permission to do it** (if that's your case, you should probably use the bot password method above).
* For Wikimedia instances (`www.wikidata.org`, `test.wikidata.org`), consumer registration is done on meta: https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose?wpownerOnly=1
* Requires that your Wikibase instance has installed the [Extension:OAuth](https://www.mediawiki.org/wiki/Extension:OAuth#User_rights) (you can check that on `/wiki/Special:Version`).
* Your [config object](#general-config) would then look something like:
  ```js
  const generalConfig = {
    instance: 'https://www.somewikibase.instance',
    credentials: {
      oauth: {
        'consumer_key': 'c60acb4f8abfa667ea5bafcdb2b673c7',
        'consumer_secret': '1adbc98303a0b5b03311ebeee80d6916cbe1bd1f',
        'token': '8de15abb42b8f9f15444ee4f13bb1f3d',
        'token_secret': '2ba1e72cb947adda5da196d5d2cc57adf12aeaec'
      }
    }
  }
  ```

#### Multi-user setup

If you are running a web service that lets people other than yourself make edits on a Wikibase instance, using their usernames and passwords isn't an option: you're only option is to setup an [OAuth consumer](https://www.mediawiki.org/wiki/OAuth/For_Developers). That's for example what inventaire.io uses to allow users to make edits on wikidata.org in their name.

* First, you need to request an OAuth consumer on the desired Wikibase instance:
  * For Wikimedia instances (`www.wikidata.org`, `test.wikidata.org`), consumer registration is done on meta: https:// meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose
  * For other Wikibase instance, see  `/wiki/Special:OAuthConsumerRegistration/propose`
* Then you will need to setup an OAuth authentification process to allow users of your web service to authorize your consumer to make edits in their name. That's the tricky part. Some libraries should help you to do that, such as [`passport-mediawiki-oauth`](https://www.npmjs.com/package/passport-mediawiki-oauth) (see [Help:Toolforge/My first NodeJS OAuth tool](https://wikitech.wikimedia.org/wiki/Help:Toolforge/My_first_NodeJS_OAuth_tool)), but some people just prefer rolling their own (ex: [inventaire.io implementation](https://github.com/inventaire/inventaire/blob/3dbec57/server/controllers/auth/wikidata_oauth.coffee)). (If you go for this later option, :warning: beware of the documentation [footnotes](https://www.mediawiki.org/wiki/OAuth/For_Developers#Notes): make sure to use the right URLs before loosing hours at a `invalid signature` error message).
  * As your requests might now be done in the name of different users each time, you will the need to pass the credentials in the [request config objects](#request-config) rather than the [general config objects](#general-config):
    ```js
    // At initialization
    const generalConfig = {
      instance: 'https://www.somewikibase.instance',
      credentials: {
        oauth: {
          'token': '8de15abb42b8f9f15444ee4f13bb1f3d',
          'token_secret': '2ba1e72cb947adda5da196d5d2cc57adf12aeaec'
        }
      }
    }

    const oauthConsumer = {
      'consumer_key': 'c60acb4f8abfa667ea5bafcdb2b673c7',
      'consumer_secret': '1adbc98303a0b5b03311ebeee80d6916cbe1bd1f',
    }

    const wbEdit = require('wikibase-edit')(generalConfig)

    // Later, when a user with OAuth tokens already setup (see previous step) makes an edit request
    const requestOauth = {
      'consumer_key': oauthConsumer['consumer_key'],
      'consumer_secret': oauthConsumer['consumer_secret'],
      'token': user.oauth['token'],
      'token_secret': user.oauth['token_secret']
    }

    const requestConfig = {
      credentials: {
        oauth: requestOauth
      }
    }

    wbEdit.label.set({ id, language, value }, requestConfig)
    ```


### Bot
The `bot` flag will mark your edits as made by a [bot account](https://www.wikidata.org/wiki/Wikidata:Bots)

### Maxlag
See [`maxlag` parameter documentation](https://www.mediawiki.org/wiki/Manual:Maxlag_parameter). If the Wikibase server returns a `maxlag` error, the request will automatically be re-executed after the amount of seconds recommended by the Wikibase server via the `Retry-After` header. This automatic retry can be disabled by setting `autoRetry` to `false` in the general config or the request config.

As specified in the MediaWiki documentation *Interactive tasks (where a user is waiting for the result) may omit the maxlag parameter*. To do so, set `maxlag = null` in the config object.

## API

All functions return promises.
See also [Wikidata API documentation](https://www.wikidata.org/w/api.php).

### Label
#### set label
```js
wbEdit.label.set({
  id: 'Q4115189',
  language: 'fr',
  value: 'Bac à sable bulgroz'
})
```

### Description
#### set description
```js
wbEdit.description.set({
  id: 'Q4115189',
  language: 'fr',
  value: 'description du Bac à sable bulgroz'
})
```

### Alias
#### add aliases
```js
// Add one alias
wbEdit.alias.add({
  id: 'Q4115189',
  language: 'fr',
  value: 'foo'
})
// Add several aliases
wbEdit.alias.add({
  id: 'Q4115189',
  language: 'fr',
  value: [ 'foo', 'bar' ]
})
```

#### remove aliases
```js
// Remove one alias
wbEdit.alias.remove({
  id: 'Q4115189',
  language: 'fr',
  value: 'foo'
})
// Remove several aliases
wbEdit.alias.remove({
  id: 'Q4115189',
  language: 'fr',
  value: [ 'foo', 'bar' ]
})
```

#### set aliases
```js
// Replace the current list of aliases in French on Q4115189 by 'foo'
wbEdit.alias.set({
  id: 'Q4115189',
  language: 'fr',
  value: 'foo'
})
// Replace the current list of aliases in French on Q4115189 by 'foo' and 'bar'
wbEdit.alias.set({
  id: 'Q4115189',
  language: 'fr',
  value: [ 'foo', 'bar']
})
```

### Claim
#### create claim
**NB**: **By default, no check is performed to see if the claims values already exist**. To perform this kind of check and avoid creating duplicated claims, see the section on **[reconciliation](#reconciliation)**.

```js
// Simplest case
wbEdit.claim.create({
  id: 'Q4115189',
  property: 'P2002',
  value: 'bulgroz'
})

// With a datatype requiring a rich value (see below for the different datatypes)
wbEdit.claim.create({
  id: 'Q4115189',
  property: 'P1476',
  value: { text: 'bulgroz', language: 'it' }
})

// Advanced case with a rank, qualifiers, and references
wbEdit.claim.create({
  id: 'Q4115189',
  property: 'P2002',
  value: 'bulgroz',
  rank: 'preferred',
  qualifiers: {
    P370: 'foo'
  },
  references: [
    { P143: 'Q8447', P813: '2020-07' },
    { P143: 'https://some.source/url', P813: '2020-07-19' }
  ]
})
```

##### monolingualtext
```js
// Monolingualtext property
wbEdit.claim.create({
  id: 'Q4115189',
  property: 'P1476',
  value: { text: 'bulgroz', language: 'it' }
})
```
##### quantity
```js
// Quantity:
// pass a single value for a count without a specific unit
wbEdit.claim.create({
  id: 'Q4115189',
  property: 'P1106',
  value: 9000
})

// pass an object for a value with a specific unit. Example here to specify minutes (Q7727)
wbEdit.claim.create({
  id: 'Q4115189',
  property: 'P2097',
  value: { amount: 9000, unit: 'Q7727', lowerBound: 9000, upperBound: 9315 }
})
```

##### time
```js
wbEdit.claim.create({
  id: 'Q4115189',
  property: 'P569',
  value: '1802-02-26'
})
```

###### precision
*see https://www.wikidata.org/wiki/Help:Dates#Precision*

By default, the precision is inferred from the input
```js
// Inferred year precision (9)
wbEdit.claim.create({ id, property, value: '1802' })
// Inferred month precision (10)
wbEdit.claim.create({ id, property, value: '1802-02' })
// Inferred day precision (11)
wbEdit.claim.create({ id, property, value: '1802-02-26' })
```

But in some cases it needs to be explicitly specified:
```js
// billion years
wbEdit.claim.create({ id, property, value: { time: '-13000000000', precision: 0 }})
// million years
wbEdit.claim.create({ id, property, value: { time: '-1000000', precision: 3 }})
// hundred thousand years
wbEdit.claim.create({ id, property, value: { time: '-100000', precision: 4 }})
// ten thousand years
wbEdit.claim.create({ id, property, value: { time: '-50000', precision: 5 }})
// millennium
wbEdit.claim.create({ id, property, value: { time: '1000', precision: 6 }})
// century
wbEdit.claim.create({ id, property, value: { time: '1800', precision: 7 }})
// decade
wbEdit.claim.create({ id, property, value: { time: '1800', precision: 8 }})
// year
wbEdit.claim.create({ id, property, value: { time: '1802', precision: 9 }})
// month
wbEdit.claim.create({ id, property, value: { time: '1802-02', precision: 10 }})
// day
wbEdit.claim.create({ id, property, value: { time: '1802-02-26', precision: 11 }})
```

###### calendar
Only 2 calendar are currently supported by Wikibase: Gregorian (Q1985727) and Julian (Q1985786)
```js
// Default calendar: Gregorian
wbEdit.claim.create({ id, property, value: '1802-02-26' })

// Use an object value to set a custom calendar. All the following options are valid:
wbEdit.claim.create({ id, property, value: { time: '0302-05-01', calendar: 'julian' }})
wbEdit.claim.create({ id, property, value: { time: '0302-05-01', calendar: 'Q1985786' }})
wbEdit.claim.create({ id, property, value: { time: '0302-05-01', calendar: 'http://www.wikidata.org/entity/Q1985786' }})
wbEdit.claim.create({ id, property, value: { time: '0302-05-01', calendarmodel: 'http://www.wikidata.org/entity/Q1985786' }})
```

##### globe-coordinate
```js
// with a precision of an arcsecond
wbEdit.claim.create({
  id: 'Q4115189',
  property: 'P626',
  value: { latitude: 45.758, longitude: 4.84138, precision: 1 / 360 }
})

```
##### Special snaktypes
```js
// somevalue
wbEdit.claim.create({
  id: 'Q4115189',
  property: 'P19',
  value: { snaktype: 'somevalue' }
})

// novalue
wbEdit.claim.create({
  id: 'Q4115189',
  property: 'P27',
  value: { snaktype: 'novalue' }
})
```

#### update claim
A function to change the value of an existing claim without having to remove it and while keeping its references and qualifiers.

##### find claim to update by value
```js
wbEdit.claim.update({
  id: 'Q4115189',
  property: 'P2002',
  oldValue: 'initial-value',
  newValue: 'new-value'
})
```
It will return a rejected promise if several claims with the same value already exist.

It can also be used for rich values such as `globecoordinate` claims:
```js
const oldValue = { latitude: 18.65, longitude: 226.2, precision: 0.01, globe: "http://www.wikidata.org/entity/Q111" }
const newValue = { latitude: 18.65, longitude: 226.2, precision: 0.01, globe: "http://www.wikidata.org/entity/Q313" }
wbEdit.claim.update({
  id: 'Q4115189',
  property: 'P2002',
  oldValue,
  newValue
})
```

##### find claim to update by claim guid
Instead of passing the old value, you can pass the [claim guid](#how-to-get-a-claim-guid). That's generally considered a more reliable approach.
```js
const guid = 'Q4115189$E66DBC80-CCC1-4899-90D4-510C9922A04F'
wbEdit.claim.update({
  guid,
  newValue: 'new-value'
})
```

##### update rank
It is possible to set the claim rank along setting a new value
```js
wbEdit.claim.update({
  guid,
  rank: 'preferred',
  newValue: 'new-value'
})
```
It is also possible to change the claim rank alone
```js
wbEdit.claim.update({
  guid,
  rank: 'preferred'
})
```

#### move claim
Move a claim from an entity to another and/or from a property to another

This function requires to know about [claim guid](#how-to-get-a-claim-guid).

##### move a single claim
* change the property of a claim (without changing entity)
```js
const wbEdit.claim.move({
  // This guid identifies a P19 claim on Q4115189
  guid: 'Q4115189$13681798-47F7-4D51-B3B4-BA8C7E044E1F',
  id: 'Q4115189',
  property: 'P20'
})
```

* move the claim to another entity (without changing the property)
```js
const wbEdit.claim.move({
  // This guid identifies a P19 claim on Q4115189
  guid: 'Q4115189$13681798-47F7-4D51-B3B4-BA8C7E044E1F',
  id: 'Q13406268',
  property: 'P19'
})
```

* move the claim to another entity and another property
```js
const wbEdit.claim.move({
  // This guid identifies a P19 claim on Q4115189
  guid: 'Q4115189$13681798-47F7-4D51-B3B4-BA8C7E044E1F',
  id: 'Q13406268',
  property: 'P20'
})
```

##### move all claims from an entity property
* change the property of all `Q4115189` `P19` claims (without changing entity)
```js
const wbEdit.claim.move({
  propertyClaimsId: 'Q4115189#P19'
  id: 'Q4115189',
  property: 'P20'
})
```

* move `Q4115189` `P19` claims to another entity (without changing the property)
```js
const wbEdit.claim.move({
  propertyClaimsId: 'Q4115189#P19'
  id: 'Q13406268',
  property: 'P19'
})
```

* move `Q4115189` `P19` claims to another entity and another property
```js
const wbEdit.claim.move({
  propertyClaimsId: 'Q4115189#P19'
  id: 'Q13406268',
  property: 'P20'
})
```

##### move claims between properties of different datatypes

If the origin and target properties are of different datatypes, a type conversion will be attempted in the following cases:
| origin datatype    | target datatype   | comment                                                                 |
|--------------------|-------------------|-------------------------------------------------------------------------|
| `external-id`      | `string`          |                                                                         |
| `monolingualtext`  | `string`          | :warning: the language will be lost                                     |
| `quantity`         | `string`          |                                                                         |
| `string`           | `external-id`     |                                                                         |
| `string`           | `quantity`        | :warning: will throw an error if the string doesn't look like a number  |

In other cases, an error will be thrown: if you think that another type conversion should be possible, please [open a ticket](https://github.com/maxlath/wikibase-edit/issues/new?template=feature_request.md&title=claim.move%3A%20add%20a%20%5Btype-a%5D-%3E%5Btype-b%5D%20type%20converter&body=%20)

#### remove claim
```js
// remove one claim
const guid = 'Q4115189$E66DBC80-CCC1-4899-90D4-510C9922A04F'
wbEdit.claim.remove({ guid })

// remove several claims on the same entity
const guids = [
  'Q4115189$BB467A9A-9123-4D0C-A87A-B7BF7ACD6477',
  'Q4115189$D2CC0D8C-187C-40CD-8CF3-F6AAFE1496F4'
]
wbEdit.claim.remove({ guid: guids })
```

See also: [How to get a claim guid](#how-to-get-a-claim-guid)

Removing claims by their `guids` is the most relyable way, but it can also convenient to just specify claims to be removed from their value:
```js
await wbEdit.claim.remove({
  id: 'Q4115189',
  property: 'P123',
  value: 'Q3208426'
})
```

To customize the way the claims to remove are found, a `reconciliation` object can be passed (see the section on [reconciliation](#reconciliation) for more details)).

```js
await wbEdit.claim.remove({
  id: 'Q4115189',
  property: 'P123',
  value: 'Q3208426',
  qualifiers: { P370: 'foo' },
  reconciliation: {
    matchingQualifiers: [ 'P370' ]
  }
})
```

### Qualifier

Those functions require to know about [claim guid](#how-to-get-a-claim-guid).

#### set qualifier

```js
const guid = 'Q4115189$E66DBC80-CCC1-4899-90D4-510C9922A04F'

// entity qualifier
wbEdit.qualifier.set({
  guid,
  property: 'P155',
  value: 'Q4115189'
})

// string qualifier
wbEdit.qualifier.set({
  guid,
  property: 'P1545',
  value: '123'
})

// time qualifier
wbEdit.qualifier.set({
  guid,
  property: 'P580',
  value: '1802-02-26'
})
wbEdit.qualifier.set({
  guid,
  property: 'P580',
  value: { time: '1802-02-26', precision: 11 }
})

// quantity qualifier
wbEdit.qualifier.set({
  guid,
  property: 'P2130',
  value: 13
})

// quantity qualifier with a unit
wbEdit.qualifier.set({
  guid,
  property: 'P2130',
  value: { amount: 123, unit: 'Q4916' }
})

// monolingualtext qualifier
wbEdit.qualifier.set({
  guid,
  property: 'P3132',
  value: { text : "les sanglots long des violons de l'automne", language: 'fr' }
})

// somevalue
wbEdit.qualifier.set({
  guid,
  property: 'P3132',
  value: { snaktype : 'somevalue' }
})

// novalue
wbEdit.qualifier.set({
  guid,
  property: 'P3132',
  value: { snaktype : 'novalue' }
})
```

See also: [How to get a claim guid](#how-to-get-a-claim-guid)

#### update qualifier

```js
wbEdit.qualifier.update({
  guid: 'Q4115189$E66DBC80-CCC1-4899-90D4-510C9922A04F',
  property: 'P155',
  oldValue: 'Q4115189',
  newValue: 'Q4115190'
})

// somevalue
wbEdit.qualifier.update({
  guid,
  property,
  oldValue,
  newValue: { snaktype : 'somevalue' }
})
// novalue
wbEdit.qualifier.update({
  guid,
  property,
  oldValue,
  newValue: { snaktype : 'novalue' }
})
```

#### move qualifier
A function to move qualifiers between properties within a claim:

##### move a unique qualifier
```js
wbEdit.qualifier.move({
  guid: 'Q4115189$E66DBC80-CCC1-4899-90D4-510C9922A04F',
  hash: '239ef1c81ef0c24611d6d7c294d07036e82c4666',
  oldProperty: 'P155',
  newProperty: 'P156'
})
```

##### move all qualifiers from a property to another
That's exactly the same as above, just not specifying a hash
```js
wbEdit.qualifier.move({
  guid: 'Q4115189$E66DBC80-CCC1-4899-90D4-510C9922A04F',
  oldProperty: 'P155',
  newProperty: 'P156'
})
```

##### move qualifiers between properties of different datatypes
This will behave in the same way as for [moving claims between properties of different datatypes](#move-claims-between-properties-of-different-datatypes)

#### remove qualifier

```js
const guid = 'Q4115189$E66DBC80-CCC1-4899-90D4-510C9922A04F'
// qualifierHash can be either a single hash string or an array of reference hash strings
const qualifierHash = '239ef1c81ef0c24611d6d7c294d07036e82c4666'
wbEdit.reference.remove({
  guid,
  hash: qualifierHash
})
```

### Reference

Those functions require to know about [claim guid](#how-to-get-a-claim-guid).

#### set reference

```js
const guid = 'Q4115189$E66DBC80-CCC1-4899-90D4-510C9922A04F'
wbEdit.reference.set({
  guid,
  snaks: {
    // reference url (P854) is 'https://example.org/rise-and-fall-of-the-holy-sand-box'
    P854: 'https://example.org/rise-and-fall-of-the-holy-sand-box'
    // imported from (P143) the French Wikipedia 'Q8447'
    P143: 'Q8447',
    // snaks can also have special snaktypes
    P370: { snaktype : 'novalue' },
    // or have several values
    P369: [
      'Q123',
      { snaktype : 'somevalue' }
    ]
  }
})
```

To update an existing reference, pass its current hash value:
```js
const guid = 'Q4115189$E66DBC80-CCC1-4899-90D4-510C9922A04F'
const referenceHash = '239ef1c81ef0c24611d6d7c294d07036e82c4666'
wbEdit.reference.set({
  guid,
  hash: referenceHash,
  snaks: {
    // Will override all existing snaks of that reference with this unique snak
    P854: 'https://example.org/rise-and-fall-of-the-holy-sand-box'
  }
})
```

#### remove reference
```js
const guid = 'Q4115189$E66DBC80-CCC1-4899-90D4-510C9922A04F'
// referenceHash can be either a single hash string or an array of reference hash strings
const referenceHash = '239ef1c81ef0c24611d6d7c294d07036e82c4666'
wbEdit.reference.remove({
  guid,
  hash: referenceHash
})
```

### Entity

#### edit entity
Make many edits on an entity at once.

##### incremental mode
By default, every label, description, claim, or sitelink that isn't included in the passed object will stay untouched: only those with a `remove` flag will be removed. Beware that this isn't true for qualifiers and references, which can be removed by just being omitted (see P1114 example below).

**NB**: **By default, no check is performed to see if the claims values already exist**. To perform this kind of check and avoid creating duplicated claims, see the section on **[reconciliation](#reconciliation)**.

```js
wbEdit.entity.edit({
  // Required
  id: 'Q4115189',
  // All the rest is optional but one of labels, descriptions, aliases, claims, or sitelinks must be set
  labels: {
    // Set a label
    en: 'a new label in English',
    // Remove a label
    fr: null
  },
  descriptions: {
    // Set a description
    en: 'a new description',
    // Remove a description
    fr: null
  },
  aliases: {
    // Pass aliases as an array
    en: [ 'foo', 'bar' ],
    // Or a single value
    de: 'buzz',
    // /!\ for any language specified, the values you pass will overwrite the existing values,
    // which means that the following empty array will remove all existing aliases in French.
    fr: [],
    // To add aliases without removing existing values, you must set 'add=true'
    nl: [
      { value: 'bul', add: true },
      { value: 'groz', add: true },
    ],
    // The same effect of clearing all aliases in a given language can be optained by passing null
    es: null
  },
  claims: {
    // Pass values as an array
    P1775: [ 'Q3576110', 'Q12206942' ],
    // Or a single value
    P2002: 'bulgroz',
    // Or a rich value object, like a monolingual text
    P2093: { text: 'Author Authorson', language: 'en' },
    // Or even an array of mixed simple values and rich object values
    P1106: [ 42, { amount: 9001, unit: 'Q7727' } ],
    // Add statements with special snaktypes ('novalue' or 'somevalue')
    P626: { snaktype: 'somevalue' },
    // or special rank (Default: 'normal'. Possible values: 'preferred' or 'deprecated')
    P6089: { rank: 'preferred', value: 123 },
    // Add qualifiers and references to value objects
    P369: [
      // Qualifier values can also be passed in those different forms
      {
        value: 'Q5111731',
        qualifiers: {
          P580: '1789-08-04'
          P1416: [ 'Q13406268', 'Q32844021' ],
          P1106: { amount: 9001, unit: 'Q7727', lowerBound: 9000, upperBound: 9315 }
        }
      },
      // References can be passed as a single reference group
      { value: 'Q2622004', references: { P143: 'Q8447' } },
      // or as multiple references groups
      {
        value: 'Q2622009',
        references: [
          { P855: 'https://example.org', P143: 'Q8447' },
          { P855: 'https://example2.org', P143: 'Q8447' }
        ]
      }
    ],
    P1114: [
      // Edit an existing claim
      // /!\ Beware that while editing an existing claim,
      //     anything omitted (rank, qualifiers, or references) will be omitted!!
      { id: 'Q4115189$BC5F4F72-5B49-4991-AB0F-5CC8D4AAB99A', value: 123 },
      // Remove an existing claim
      { id: 'Q4115189$afc56f6c-4e91-c89d-e287-d5691aeb063a', remove: true }
    ]
  },
  sitelinks: {
    // Set a sitelink
    frwiki: 'eviv bulgroz',
    // Remove a sitelink
    eswikisource: null
  },

  // For convenience, the summary and baserevid can also be passed from this edit object
  summary: 'doing a bunch of edits',
  baserevid: 1234,
})
```

##### reset mode
If the entity you are editing requires a big cleanup, instead of adding a `remove` flag to all the elements that needs to be removed, you can set the `clear` flag to `true`, which will **delete all the entity data** before adding the specified data:
```js
// Remove ALL the labels, descriptions, aliases, claims, and sitelinks, and set the English label to 'Sandbox'
wbEdit.entity.edit({
  id: 'Q4115189',
  clear: true,
  labels: {
    en: 'Sandbox'
  }
})
```

#### create entity
##### create item
Create an [item](https://www.wikidata.org/wiki/Wikidata:Glossary#Item) from scratch.
The item data follow the same rules as [`wbEdit.entity.edit`](#edit-entity), simply without the `id`

```js
const { entity } = await wbEdit.entity.create({
  type: 'item',
  labels,
  descriptions,
  aliases,
  claims,
  sitelinks
})
console.log('created item id', entity.id)
```

##### create property
Creating a [property](https://www.wikidata.org/wiki/Wikidata:Glossary#Property) is just like creating an item, but with a `type=property` and a `datatype`

```js
const { entity } = await wbEdit.entity.create({
  type: 'property',
  datatype: 'string',
  labels,
  descriptions,
  aliases,
  claims
})
console.log('created property id', entity.id)
```

#### merge entity
##### merge item
```js
// Merge Q1 into Q2, turning Q1 into a redirection
wbEdit.entity.merge({ from: 'Q1', to: 'Q2' })
```

##### merge property
Wikibase doesn't allow to merge properties

#### delete entity
##### delete item
```js
wbEdit.entity.delete({ id: 'Q1' })
```

##### delete property
```js
wbEdit.entity.delete({ id: 'P1' })
```

### get auth data
All the functions above handle authentification for you, but you can also access the auth data, that is session cookies and the currently valid [csrf token](https://www.mediawiki.org/wiki/Manual:Edit_token), using the `getAuthData` function.
```js
const { cookie, token } = await wbEdit.getAuthData()
```
It can also be used as a way to validate credentials:
```js
require('wikibase-edit')({ instance, credentials }).getAuthData()
.then(onValidCredentials)
.catch(onInvalidCredentials)
```

## Reconciliation

Several functions accept a `reconciliation` object, allowing to customize how the input is matched to existing claims, and what should be done once a match is established:
* [`entity.edit`](#edit-entity)
* [`claim.create`](#create-claim)
* [`claim.remove`](#remove-claim)

### matching
#### claim matching
By default, a claim is considered to be matching if its value (a.k.a. `mainsnak`) is matching.

To also require to take qualifiers in consideration, when determining if a claim is matching, you can specify an array of `matchingQualifiers` properties. Example:
```js
{
  reconciliation: {
    matchingQualifiers: [ 'P580', 'P582' ]
    // The line above is equivalent to
    matchingQualifiers: [ 'P580:all', 'P582:all' ]
    // that is that all qualifiers in the input should match qualifiers
    // on the existing claim for the claim to be considered a match.
    // To match on any qualifier for each of those properties instead, you could add the suffix `any`
    matchingQualifiers: [ 'P580:any', 'P582:any' ]
  }
}
```

#### reference matching
Once a claim is determined as matching (be it only from its `mainsnak` value or also taking its `qualifiers` into account), references can also be matched by specifying a `matchingReferences` array, but this is specific to references and won't influence the claim matching. It is just a way, once a matching claim is found, to avoid creating duplicated references.
```js
{
  reconciliation: {
    matchingReferences: [ 'P854', 'P813' ]
    // The line above is equivalent to
    matchingQualifiers: [ 'P854:all', 'P813:all' ]
    // that is that all reference snaks in the input should match reference snaks
    // on an existing reference for the reference to be considered a match.
    // To match on any reference snak for each of those properties instead, you could add the suffix `any`
    matchingQualifiers: [ 'P854:any', 'P813:any' ]
  }
}
```

### reconciliation modes
Once a claim is determined as matching, several modes can be used to determine what should be done with that matching claim. This also applies to matching references.

#### skip-on-any-value mode
* Checks if there is already a statement for that property, whatever the value
* If any statement is found, no change is performed on that statement, no new statement is added either

```js
wbEdit.entity.edit({
  id: 'Q4115189',
  reconciliation: {
    mode: 'skip-on-any-value'
  },
  claims: {
    // If Q4115189 already has a P1775 claim, this won't add anything
    P1775: [
      'Q3576110',
    ]
  },
})
```

#### skip-on-value-match mode
* Checks if there is a statement with the specified value
* If a matching statement is found, no change is performed on that statement, no new statement is added either

```js
wbEdit.entity.edit({
  id: 'Q4115189',
  reconciliation: {
    mode: 'skip-on-value-match'
  },
  claims: {
    // Those new values will only be added if there is no P1775 statement with those values
    P1775: [
      'Q3576110',
    ]
  },
})
```

#### merge mode
* Checks if there is a statement with the specified value
* If a matching statement is found, no change is performed on that statement, no new statement is added either

```js
wbEdit.entity.edit({
  id: 'Q4115189',
  claims: {
    P1775: [ 'Q3576110', 'Q12206942' ]
  },
  reconciliation: {
    mode: 'merge'
  }
})
```
If the initial state was
```js
{ id: 'Q4115189', claims: { P1775: [ 'Q3576110' ] }
```
after this edit it will be
```js
{ id: 'Q4115189', claims: { P1775: [ 'Q3576110', 'Q12206942' ] }
```

## Tips
### How to get a claim guid
A globally unique identifier, or `guid` for short, is the unique identifier of a [claim](https://www.wikidata.org/wiki/Wikidata:Glossary#Claim). As such, it is used by several functions working with existing claims. While the Wikibase API sometimes just refers to those as ids, `wikibase-edit` always refer to those as guids to avoid the confusion with entities ids.

But "how do I get those guids?" you may ask. There are different pathways:

Maybe you got that id in a response from a previous edit:
```js
const res = await wbEdit.claim.create({
  id: 'Q4115189',
  property: 'P2002',
  value: 'bulgroz'
})

// Here is our new claim guid, ready to be used in our next edit!
const guid = res.claim.id

const res2 = await wbEdit.claim.remove({ guid }, { summary: 'oops' })
// res2.claim.id === guid
```

Maybe you fetched an entity's data:
```js
// Example where we try to get the guid of Q1's first P31 claim

const fetch = require('node-fetch')
const wbk = require('wikibase-sdk')({ instance: 'https://www.wikidata.org', sparqlEndpoint: 'https://query.wikidata.org/sparql' })

const url = wbk.getEntities({ ids: [ 'Q1' ] })
const { entities } = await fetch(url).then(res => res.json())

const firstP31Claim = entities.Q1.claims.P31[0]
// Here is our guid!
const guid = firstP31Claim.id
```

Maybe you got guids from a SPARQL query:
```js
const sparql = 'SELECT ?statement { ?item p:P4033 ?statement . } LIMIT 5'
const url = wbk.sparqlQuery(sparql)
const results = await fetch(url)
  .then(res => res.json())
  .then(wbk.simplify.sparqlResults)

// Here are our statement guids!
const guids = results.map(result => result.statement)
```
