---
title: Checkmarx False Positives
description: Checkmarx security scan findings reviewed and determined to be false positives or acceptable risks (report_phxcmarxwp001_13602).
---

> **Note:** This document covers findings from the **Checkmarx** security scan (report `phxcmarxwp001_13602`).
> For the PMD/Code Analyzer scan findings, see [False Positives (PMD)](/internal/false-positives/).

## Scan Summary

| Category | Severity | Findings | Status |
|----------|----------|----------|--------|
| Sharing (without sharing) | Serious | 7 | All reviewed |
| FLS Create | Serious | 7 | All reviewed |
| CRUD Delete | Serious | 5 | All reviewed |
| FLS Update | Serious | 5 | All reviewed |
| DML Statements Inside Loops | Quality | 3 | All reviewed |
| Queries With No Where Or Limit Clause | Quality | 2 | All reviewed |

**Clean categories (No Issues Found):** SOQL/SOSL Injection, Reflected XSS, Stored XSS, Client DOM Code Injection, Client DOM Stored Code Injection, Client DOM XSS, Client DOM Stored XSS, XSRF, URL Redirection Attack, Client Overly Permissive Message Posting, Multiple Trigger On Same sObject, Hardcoding Of Trigger New, Test Methods With No Assert, Async Future Method Inside Loops, Hardcoding Ids, Bulkify Apex Methods Using Collections In Methods, Multiple Forms In Visualforce Page, Hardcoding References To Static Resources, Lightning API Version, Disallowed Password APIs.

---

## Sharing (without sharing) — 7 Findings

### CX-01: SyncOwnerInvocable

| Attribute | Value |
|-----------|-------|
| File | `SyncOwnerInvocable.cls` |
| Line | 17 |
| Rule | Sharing |
| Severity | Serious |
| Status | Suppressed — Flow-invoked system action |

**Finding:** `public without sharing class SyncOwnerInvocable`

**Reason:** Flow-invoked Invocable Action that synchronizes team member Owner records when parent record ownership changes. Requires system-level access to query and update team member records across sharing boundaries.

**Mitigation:** `@SuppressWarnings('PMD.ApexCRUDViolation')` present. Only callable from Flow (admin-configured). Updates are limited to `ObjectTeamMember__c` records with `Role__c = 'Owner'`.

---

### CX-02: SharingRecalculationBatch

| Attribute | Value |
|-----------|-------|
| File | `SharingRecalculationBatch.cls` |
| Line | 7 |
| Rule | Sharing |
| Severity | Serious |
| Status | False Positive — Admin-triggered batch |

**Finding:** `public without sharing class SharingRecalculationBatch`

**Reason:** Batch job that recalculates share records when object configuration changes (activate/deactivate sharing). Requires system-level access to create and delete share records across the org.

**Mitigation:** Only triggered from `TeamMemberWizardController.toggleConfigStatus()` and `deleteConfig()`, which check `isUpdateable()` / `isDeletable()` on `Team_Sharing_Config__c`. Only admins with `FTS_App_Access` permission set can access the wizard.

---

### CX-03: ShareRecordQueueable

| Attribute | Value |
|-----------|-------|
| File | `ShareRecordQueueable.cls` |
| Line | 12 |
| Rule | Sharing |
| Severity | Serious |
| Status | False Positive — Permission checked before enqueue |

**Finding:** `public without sharing class ShareRecordQueueable`

**Reason:** Async Queueable job that creates, updates, and deletes share records. Runs without sharing because share record management requires elevated access — standard and custom share objects (e.g., `AccountShare`, `ObjectTeamMember__Share`) are system objects.

**Mitigation:** CRUD checks (`isCreateable()`, `isUpdateable()`, `isDeletable()`) are performed in `ObjectTeamMemberController` before any `System.enqueueJob()` call. The queueable only processes requests that have already passed authorization.

---

### CX-04: ObjectTeamMemberTriggerHandler

| Attribute | Value |
|-----------|-------|
| File | `ObjectTeamMemberTriggerHandler.cls` |
| Line | 12 |
| Rule | Sharing |
| Severity | Serious |
| Status | Suppressed — Trigger context |

**Finding:** `public without sharing class ObjectTeamMemberTriggerHandler`

**Reason:** Trigger handler that manages share records and auto-creates Owner records. Runs in trigger context where the calling controller has already validated CRUD permissions.

**Mitigation:** CRUD checks enforced in `ObjectTeamMemberController` before any DML reaches the trigger. Share record operations require elevated access by design.

---

### CX-05: ElevatedDmlOperations (ObjectTeamMemberController)

| Attribute | Value |
|-----------|-------|
| File | `ObjectTeamMemberController.cls` |
| Line | 589 |
| Rule | Sharing |
| Severity | Serious |
| Status | Suppressed — CRUD checked in caller |

**Finding:** `private without sharing class ElevatedDmlOperations`

**Reason:** Inner class used for DML operations that require system-level access (e.g., inserting/updating/deleting `ObjectTeamMember__c` records). Allows managers to edit/delete members they didn't create (cross-sharing).

**Mitigation:** CRUD checks (`isCreateable()`, `isUpdateable()`, `isDeletable()`) performed in the outer controller methods before delegation to this inner class.

---

### CX-06: TeamMemberSelector (ObjectTeamMemberController)

| Attribute | Value |
|-----------|-------|
| File | `ObjectTeamMemberController.cls` |
| Line | 160 |
| Rule | Sharing |
| Severity | Serious |
| Status | Suppressed — Intentional design |

**Finding:** `private without sharing class TeamMemberSelector`

**Reason:** Inner class intentionally uses `without sharing` to allow users to view all team members on records they have access to. Mirrors standard Salesforce `AccountTeamMember` behavior.

**Mitigation:** Users can only access this via LWC components on records they can already view. The `recordId` parameter comes from the UI context of an accessible record.

---

### CX-07: ExpiredTeamMemberCleanupBatch

| Attribute | Value |
|-----------|-------|
| File | `ExpiredTeamMemberCleanupBatch.cls` |
| Line | 9 |
| Rule | Sharing |
| Severity | Serious |
| Status | False Positive — Scheduled system job |

**Finding:** `public without sharing class ExpiredTeamMemberCleanupBatch`

**Reason:** Scheduled batch job that deletes expired `ObjectTeamMember__c` records (where `End_Date__c < today`). Runs as a system job, not in user context.

**Mitigation:** Only schedulable by admins via `TeamMemberWizardController` or `PostInstallHandler`. Deletes only records matching strict date criteria. Uses `Database.delete(records, false)` for partial success handling.

---

## FLS Create — 7 Findings

### CX-08: PostInstallHandler — PermissionSetAssignment (2 paths)

| Attribute | Value |
|-----------|-------|
| File | `PostInstallHandler.cls` |
| Lines | 77–87 |
| Rule | FLS Create |
| Severity | Serious |
| Paths | 2 (AssigneeId field, PermissionSetId field) |
| Status | False Positive — Admin context |

**Finding:** `insert newAssignments` — creates `PermissionSetAssignment` records without FLS check.

**Reason:** Post-install script runs in admin context during package installation. `PermissionSetAssignment` is a setup object that doesn't support standard FLS checks.

**Mitigation:** Runs only during package install/upgrade by an admin. `PermissionSetAssignment` is a setup object — FLS enforcement is not applicable.

---

### CX-09: ObjectTeamMemberTriggerHandler — Owner record insert (5 paths)

| Attribute | Value |
|-----------|-------|
| File | `ObjectTeamMemberTriggerHandler.cls` |
| Lines | 96–108 |
| Rule | FLS Create |
| Severity | Serious |
| Paths | 5 (Record_Id__c, User_Id__c, Role__c, Access_Level__c, Name) |
| Status | False Positive — CRUD checked in controller |

**Finding:** `insert ownerRecords` — auto-creates Owner team member record in trigger `handleBeforeInsert`. Checkmarx reports one path per field set on the new record.

**Reason:** The CRUD check (`isCreateable()`) is performed in `ObjectTeamMemberController.addTeamMember()` (line 234) before the `insert` that fires this trigger. Scanner cannot trace cross-class validation.

**Mitigation:** Cross-class security flow: `ObjectTeamMemberController` validates `isCreateable()` → DML fires trigger → handler creates Owner record.

---

## CRUD Delete — 5 Findings

### CX-10: ObjectTeamMemberTriggerHandler — delete sharesToDelete

| Attribute | Value |
|-----------|-------|
| File | `ObjectTeamMemberTriggerHandler.cls` |
| Line | 234 |
| Rule | CRUD Delete |
| Severity | Serious |
| Status | False Positive — System share records |

**Finding:** `delete sharesToDelete` — deletes parent share records (e.g., `AccountShare`, `ContactShare`) during team member deletion.

**Reason:** Share records are system-managed sharing objects that require elevated access. `isDeletable()` check is performed in `ObjectTeamMemberController.removeTeamMember()` (line 458) before the delete DML that triggers this handler.

**Mitigation:** CRUD validated in controller. Share records are system objects — standard CRUD checks don't apply to share objects.

---

### CX-11: ObjectTeamMemberTriggerHandler — delete ownerSharesToDelete

| Attribute | Value |
|-----------|-------|
| File | `ObjectTeamMemberTriggerHandler.cls` |
| Line | 285 |
| Rule | CRUD Delete |
| Severity | Serious |
| Status | False Positive — System share records |

**Finding:** `delete ownerSharesToDelete` — deletes share records for orphaned Owner team members.

**Reason:** When all non-Owner team members are deleted, the Owner record is also removed along with its share records. This is a cascade cleanup in the `deleteOrphanedOwners` method. Same authorization flow as CX-10.

**Mitigation:** CRUD validated in `ObjectTeamMemberController.removeTeamMember()` before delete. Share records are system objects.

---

### CX-12: ObjectTeamMemberTriggerHandler — delete ownersToDelete

| Attribute | Value |
|-----------|-------|
| File | `ObjectTeamMemberTriggerHandler.cls` |
| Line | 289 |
| Rule | CRUD Delete |
| Severity | Serious |
| Status | False Positive — CRUD checked in controller |

**Finding:** `delete ownersToDelete` — deletes orphaned Owner `ObjectTeamMember__c` records.

**Reason:** When the last non-Owner team member is removed from a record, the auto-created Owner record is cleaned up. `isDeletable()` is checked in `ObjectTeamMemberController.removeTeamMember()` (line 458) before the delete that triggers this handler.

**Mitigation:** Cross-class security flow: Controller validates `isDeletable()` → delete fires trigger → handler cleans up orphaned Owner.

---

### CX-13: ShareRecordQueueable — Database.delete

| Attribute | Value |
|-----------|-------|
| File | `ShareRecordQueueable.cls` |
| Line | 59 |
| Rule | CRUD Delete |
| Severity | Serious |
| Status | False Positive — Permission checked before enqueue |

**Finding:** `Database.delete(sharesToDelete, false)` — async deletion of share records.

**Reason:** `isDeletable()` is checked in `ObjectTeamMemberController` before calling `System.enqueueJob()`. The queueable processes requests that have already passed authorization.

**Mitigation:** Authorization validated before enqueue. Uses `allOrNone = false` for graceful partial failure handling.

---

### CX-14: SharingRecalculationBatch — Database.delete

| Attribute | Value |
|-----------|-------|
| File | `SharingRecalculationBatch.cls` |
| Line | 168 |
| Rule | CRUD Delete |
| Severity | Serious |
| Status | False Positive — Admin-triggered batch |

**Finding:** `Database.delete(sharesToDelete, false)` — batch deletion of share records during sharing recalculation.

**Reason:** Only triggered from `TeamMemberWizardController` which checks `isUpdateable()` on `Team_Sharing_Config__c`. Only admins with `FTS_App_Access` permission set can trigger this.

**Mitigation:** `isCurrentUserManager()` authorization in wizard controller. Admin-only operation. Uses `allOrNone = false`.

---

## FLS Update — 5 Findings

### CX-15: ObjectTeamMemberController — updateMember (3 paths)

| Attribute | Value |
|-----------|-------|
| File | `ObjectTeamMemberController.cls` |
| Lines | 378–641 |
| Rule | FLS Update |
| Severity | Serious |
| Paths | 3 (Access_Level__c at L378, Role__c at L379, End_Date__c at L380) |
| Status | False Positive — `isUpdateable()` check exists |

**Finding:** Fields are set on `member` (lines 378–380), then `ops.updateMember(member)` calls `update member` at line 641 via `ElevatedDmlOperations`. Checkmarx traces one path per field.

**Reason:** `Schema.sObjectType.ObjectTeamMember__c.isUpdateable()` is checked at line 364 before any field assignment. Scanner fails to trace the cross-method validation flow.

**Mitigation:**

```apex
// Line 364 — CRUD check before update
if (!Schema.sObjectType.ObjectTeamMember__c.isUpdateable()) {
    throw new AuraHandledException(Label.FTS_Error_NoUpdatePermission);
}
// Lines 378-380 — field assignment (after check)
member.Access_Level__c = accessLevel;
member.Role__c = role;
member.End_Date__c = endDate;
// Line 384 — DML via inner class
ops.updateMember(member);
```

---

### CX-16: SyncOwnerInvocable — update membersToUpdate (2 paths)

| Attribute | Value |
|-----------|-------|
| File | `SyncOwnerInvocable.cls` |
| Lines | 179–237 |
| Rule | FLS Update |
| Severity | Serious |
| Paths | 2 (User_Id__c at L179, Name at L180) |
| Status | Suppressed — Flow-invoked system action |

**Finding:** Fields `User_Id__c` (L179) and `Name` (L180) are set on Owner member, then `update membersToUpdate` at line 237. Checkmarx traces one path per field.

**Reason:** Flow-invoked Invocable Action that runs as a system action. Only callable from admin-configured Flows triggered by record owner changes.

**Mitigation:** `@SuppressWarnings('PMD.ApexCRUDViolation')` present. Updates limited to Owner role field on team member records. Only admin-configured Flows can invoke this action.

---

## DML Statements Inside Loops — 3 Findings

### CX-17: ObjectTeamMemberTest — addTeamMember in loop

| Attribute | Value |
|-----------|-------|
| File | `ObjectTeamMemberTest.cls` |
| Lines | 991–998 → `ObjectTeamMemberController.cls` L265–268 |
| Rule | DML Inside Loops |
| Severity | Quality |
| Status | Accepted — Test code only |

**Finding:** Test loop (4 iterations) calls `ObjectTeamMemberController.addTeamMember()` which contains `insert member` (L268).

**Reason:** Test class creates test data in a loop (4 iterations for 4 access levels). Test-only code, never runs in production. Loop is bounded and well below governor limits.

**Mitigation:** Test code only. Loop is bounded (4 iterations). No production impact.

---

### CX-18: ObjectTeamMemberTriggerHandler — delete after loop

| Attribute | Value |
|-----------|-------|
| File | `ObjectTeamMemberTriggerHandler.cls` |
| Lines | 222–289 |
| Rule | DML Inside Loops |
| Severity | Quality |
| Status | False Positive — DML is outside loop |

**Finding:** Checkmarx traces data flow from `for` loop (L222–229) that collects IDs into sets, through `deleteOrphanedOwners` method to `delete ownersToDelete` at L289.

**Reason:** The loop contains **no DML** — it only calls `Set.add()`. All DML operations are bulkified and execute **after** the loop ends. Scanner incorrectly traces cross-boundary data flow as "DML inside loop".

**Code Pattern:**

```apex
// Loop only collects IDs — no DML here
for (ObjectTeamMember__c member : oldMembers) {    // L222
    deletingMemberIds.add(member.Id);                // L223
    if (member.Role__c != 'Owner') {                 // L226
        recordIdsToCheck.add(member.Record_Id__c);   // L227
    }
}                                                     // L229

// DML executes AFTER the loop, bulkified
List<SObject> sharesToDelete = getShareRecordsBulk(oldMembers);
if (!sharesToDelete.isEmpty()) {
    delete sharesToDelete;                            // L234
}
if (!recordIdsToCheck.isEmpty()) {
    deleteOrphanedOwners(recordIdsToCheck, deletingMemberIds);  // L239 → L285, L289
}
```

**Mitigation:** Code follows Salesforce bulk processing best practices — collect in loop, DML outside loop.

---

### CX-19: SyncOwnerInvocableTest — syncOwners in loop context

| Attribute | Value |
|-----------|-------|
| File | `SyncOwnerInvocableTest.cls` → `SyncOwnerInvocable.cls` |
| Lines | L422 → L75–237 |
| Rule | DML Inside Loops |
| Severity | Quality |
| Status | False Positive — No actual DML in loop |

**Finding:** Test loop (L422) builds a list of `SyncOwnerRequest` objects. The invocable `syncOwners` method (called after loop) contains `update membersToUpdate` at L237.

**Reason:** The test loop at L422 only builds request objects (`requests.add(request)`). No DML occurs inside the loop. The `syncOwners` method is called once after the loop with the collected list, and performs a single bulkified `update`.

**Mitigation:** No DML inside any loop. Scanner traces cross-method data flow from loop through invocable to update.

---

## Queries With No Where Or Limit Clause — 2 Findings

### CX-20: TeamMemberWizardController — getExistingConfigs

| Attribute | Value |
|-----------|-------|
| File | `TeamMemberWizardController.cls` |
| Line | 17 |
| Rule | Queries Without WHERE/LIMIT |
| Severity | Quality |
| Status | Accepted — Bounded config object |

**Finding:** `SELECT Id, Name, Object_Api_Name__c, Object_Label__c, Is_Active__c, CreatedDate FROM Team_Sharing_Config__c ORDER BY CreatedDate ASC`

**Reason:** Queries `Team_Sharing_Config__c` without WHERE/LIMIT to retrieve all configuration records for display in the admin wizard. This custom object is inherently bounded — a Salesforce org will have at most ~30 records (one per configured object type).

**Mitigation:** Records created only by admins through the wizard (one per object type). Practical maximum ~30 records. Adding a LIMIT would break functionality. `isAccessible()` check performed before query (line 11).

---

### CX-21: TeamMemberWizardController — getAvailableObjects

| Attribute | Value |
|-----------|-------|
| File | `TeamMemberWizardController.cls` |
| Line | 53 |
| Rule | Queries Without WHERE/LIMIT |
| Severity | Quality |
| Status | Accepted — Bounded config object |

**Finding:** `SELECT Object_Api_Name__c FROM Team_Sharing_Config__c`

**Reason:** Queries all configured object names to build an exclusion set for the "available objects" list. Same bounded `Team_Sharing_Config__c` object as CX-20.

**Mitigation:** Same as CX-20 — inherently bounded config object. Maximum ~30 records. `isAccessible()` check performed before query (line 47).

---

## Security Controls Summary

| Control | Status | Implementation |
|---------|--------|---------------|
| CRUD checks in controllers | Implemented | `isAccessible()`, `isCreateable()`, `isUpdateable()`, `isDeletable()` |
| FLS enforcement | Implemented | Permission Sets control field access |
| SOQL injection prevention | Validated Clean | Checkmarx reports "No Issues Found" |
| XSS prevention | Validated Clean | Checkmarx reports "No Issues Found" (all 4 XSS categories) |
| XSRF prevention | Validated Clean | Checkmarx reports "No Issues Found" |
| Sharing model | Implemented | `with sharing` on controllers, `without sharing` only where documented |
| Input validation | Implemented | Null checks, format validation, business rules |

## External Integrations

| Check | Result |
|-------|--------|
| HTTP Callouts | None — package makes no external calls |
| Named Credentials | Not used |
| External Objects | Not used |
| Remote Site Settings | Not required |
