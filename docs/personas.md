# Personas

Named by role, never by individual. Every spec references at least one of these and states the impact on each.

> The "Goals", "Pain Points" and "Context" lines for User, Rigger and Dropzone are placeholders until the product
> briefing for Bendike lands (see `.github/specs/landing-page.md`, Open Questions). Working assumption: Bendike is
> about skydiving, where a rigger maintains parachute equipment and a dropzone is the place people jump. Update
> this file first, then the specs.

## Visitor

**Role**: Someone who is not signed in.
**Goals**: Understand what Bendike is in under a minute; decide whether to create an account.
**Pain Points**: Landing pages that assume you already know the product.
**Context**: Arrives from a link or search, probably on a phone.

## User

**Role**: A signed-in account with the `user` role. Every new account starts here.
**Goals**: TBD from briefing. Working assumption: a skydiver who needs a rigger or a dropzone.
**Pain Points**: TBD from briefing.
**Context**: TBD from briefing.

## Rigger

**Role**: A signed-in account with the `rigger` role, promoted by an admin.
**Goals**: TBD from briefing. Working assumption: offer rigging services (inspections, repacks, repairs) and take
on requests from users and dropzones.
**Pain Points**: TBD from briefing.
**Context**: TBD from briefing.

## Dropzone

**Role**: A signed-in account with the `dropzone` role, promoted by an admin. Represents an organisation (the venue
or its operator), not a person.
**Goals**: TBD from briefing. Working assumption: be findable by users, list what the dropzone offers, and work with
riggers.
**Pain Points**: TBD from briefing.
**Context**: TBD from briefing. Open question: one login per dropzone, or several staff logins?

## Admin

**Role**: A signed-in account with the `admin` role.
**Goals**: Keep the community safe; decide who is a rigger or a dropzone; manage accounts without a database console.
**Pain Points**: Having to run SQL to promote someone; accidentally locking themselves out.
**Context**: One or two people at first. The first admin is created from environment variables.
