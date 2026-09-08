# Bug Template

**Use this template when reporting bugs via `/add-bug --from file.md`**

**All bug reports must be in English only.**

---

### BUG: {{BUG_TITLE}}

**Severity:** {{Critical | High | Medium | Low}}
**Affected Component:** {{Component/File path}}
**Story Points:** {{1, 2, 3, 5, 8, 13}} _(optional - will estimate if not provided)_

**Description:**
{{Brief description of what's broken}}

**Reproduction Steps:**
1. {{Step 1}}
2. {{Step 2}}
3. {{Step 3}}

**Expected Behavior:**
{{What should happen}}

**Actual Behavior:**
{{What actually happens}}

**Additional Notes:** _(optional)_
{{Screenshots, error logs, environment details, etc.}}

---

## Example Bug Report

### BUG: User login fails with valid credentials

**Severity:** High
**Affected Component:** src/auth/LoginController.php
**Story Points:** 5

**Description:**
Users cannot log in even with correct username and password. Login form shows "Invalid credentials" error.

**Reproduction Steps:**
1. Navigate to /login
2. Enter valid username: testuser@example.com
3. Enter valid password: Test123!
4. Click "Login" button
5. See error message "Invalid credentials"

**Expected Behavior:**
User should be logged in and redirected to dashboard

**Actual Behavior:**
Login form shows "Invalid credentials" error and user remains on login page

**Additional Notes:**
- Started happening after updating to Laravel 11
- Error log shows: "SQLSTATE[HY000] [2002] Connection refused"
- Database connection seems to fail intermittently
