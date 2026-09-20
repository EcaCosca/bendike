# Personas

Named by role, never by individual. Every spec references at least one of these and states the impact on each.

Bendike is a skydiving company: a rigging loft in Argentina owned by Enrique "Eca" Coscarelli, and the software he
builds so skydivers, riggers and dropzones stay on top of reserve repacks, AAD service and manufacturer service
bulletins. Safety is the main priority. (Briefing of 2026-09-11.)

## Visitor

**Role**: Someone who is not signed in.
**Goals**: Understand what Bendike is and who Eca is in under a minute; decide whether to create an account.
**Pain Points**: Landing pages that assume you already know the product.
**Context**: Arrives from Instagram, LinkedIn or word of mouth at a dropzone, probably on a phone.

## User

**Role**: A skydiver. Every new account starts here.
**Goals**: Know when the reserve repack is due, when the AAD needs service or a battery, and whether a service
bulletin applies to their gear. Find and book a rigger they trust.
**Pain Points**: Dates written on a packing data card that nobody looks at; bulletins that never reach them;
finding out at the dropzone that the rig is out of date.
**Context**: Jumps at weekends; owns or rents a rig; checks their phone between loads.

## Rigger

**Role**: A certified parachute rigger, promoted by an admin.
**Goals**: Offer repacks, inspections and repairs; log every pack job; keep customers current so nobody jumps
out-of-date gear.
**Pain Points**: Paper logbooks, chasing customers about due dates, bulletins arriving by forum post.
**Context**: Works from a loft or travels to dropzones; Eca himself is the first rigger.

## Dropzone

**Role**: An organisation account for a dropzone (the venue or its operator), promoted by an admin. Not a person.
**Goals**: See the status of the gear jumping at the DZ and work with the riggers who keep it safe.
**Pain Points**: Manual gear checks at manifest; no view of which rigs on the load are current.
**Context**: One login per dropzone for now; staff logins are an open question.

## Authority

**Role**: A signed-in account with the `authority` role, held by a governing body over riggers (in Argentina, ANAC).
**Goals**: Know who the riggers are and inspect what each has signed and recorded, without asking for a paper logbook,
and see every rig packed and which belong to jumpers who live in its own country.
**Pain Points**: Logbooks held by each rigger, no single register, no way to check activity without visiting.
**Context**: Read only. Sees the register of riggers, each rigger's signed sheets, work and groundings, and the list of
packed rigs with the owner's name and country, and nothing else of owners' gear, photos or manuals. Its own country
decides what counts as local.

## Admin

**Role**: A signed-in account with the `admin` role.
**Goals**: Keep the community safe; decide who is a rigger or a dropzone; manage accounts without a database console.
**Pain Points**: Having to run SQL to promote someone; accidentally locking themselves out.
**Context**: Eca at first. The first admin is created from environment variables.
