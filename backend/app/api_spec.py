"""
OpenAPI 3.0 specification for the TTP Tracker API.
Returned as JSON by GET /docs/api/openapi.json.
"""

SPEC = {
    "openapi": "3.0.3",
    "info": {
        "title": "TTP Tracker API",
        "version": "1.0.0",
        "description": (
            "REST API for the TTP Tracker purple-team exercise platform.\n\n"
            "## Authentication\n"
            "All endpoints except `/api/auth/login` and `/api/auth/signup` require a "
            "Bearer JWT token obtained from `POST /api/auth/login`.\n\n"
            "## Roles\n"
            "| Role | Description |\n"
            "|------|-------------|\n"
            "| `admin` | Full access including user management |\n"
            "| `red_team` | Create exercises, full entry CRUD (red fields only on update) |\n"
            "| `blue_team` | Read exercises and entries, update blue-team fields only |\n\n"
            "New accounts require admin approval before they can log in."
        ),
        "contact": {"email": "willem.mouton@cybercx.com.au"},
    },
    "servers": [{"url": "/", "description": "Current host"}],
    "security": [{"BearerAuth": []}],
    "components": {
        "securitySchemes": {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "JWT obtained from POST /api/auth/login",
            }
        },
        "schemas": {
            "Error": {
                "type": "object",
                "properties": {"error": {"type": "string", "example": "name is required"}},
            },
            "User": {
                "type": "object",
                "properties": {
                    "id":          {"type": "integer", "example": 1},
                    "username":    {"type": "string",  "example": "alice"},
                    "email":       {"type": "string",  "format": "email", "nullable": True, "example": "alice@example.com"},
                    "role":        {"type": "string",  "enum": ["admin", "red_team", "blue_team", "pending"], "example": "red_team"},
                    "is_approved": {"type": "boolean", "example": True},
                    "is_active":   {"type": "boolean", "example": True},
                    "created_at":  {"type": "string",  "format": "date-time"},
                },
            },
            "Tag": {
                "type": "object",
                "properties": {
                    "id":    {"type": "integer", "example": 1},
                    "name":  {"type": "string",  "example": "Phishing"},
                    "color": {"type": "string",  "example": "#6366f1"},
                },
            },
            "Tactic": {
                "type": "object",
                "properties": {
                    "id":              {"type": "integer", "example": 1},
                    "mitre_id":        {"type": "string",  "example": "TA0001"},
                    "name":            {"type": "string",  "example": "Initial Access"},
                    "technique_count": {"type": "integer", "example": 9},
                },
            },
            "TTP": {
                "type": "object",
                "properties": {
                    "id":          {"type": "integer", "example": 42},
                    "mitre_id":    {"type": "string",  "example": "T1059.001"},
                    "name":        {"type": "string",  "example": "PowerShell"},
                    "tactic":      {"type": "string",  "example": "Execution"},
                    "description": {"type": "string",  "nullable": True},
                    "platform":    {"type": "string",  "nullable": True, "example": "Windows,Linux"},
                    "tactics":     {"type": "array", "items": {"$ref": "#/components/schemas/Tactic"}},
                    "created_at":  {"type": "string",  "format": "date-time"},
                },
            },
            "Exercise": {
                "type": "object",
                "properties": {
                    "id":          {"type": "integer",  "example": 1},
                    "name":        {"type": "string",   "example": "Q3 Red Team"},
                    "description": {"type": "string",   "nullable": True},
                    "status":      {"type": "string",   "enum": ["planned", "active", "completed"], "example": "active"},
                    "start_date":  {"type": "string",   "format": "date", "nullable": True, "example": "2026-07-01"},
                    "end_date":    {"type": "string",   "format": "date", "nullable": True, "example": "2026-07-05"},
                    "tags":        {"type": "array",    "items": {"$ref": "#/components/schemas/Tag"}},
                    "created_at":  {"type": "string",   "format": "date-time"},
                    "updated_at":  {"type": "string",   "format": "date-time"},
                },
            },
            "ExerciseSummary": {
                "type": "object",
                "properties": {
                    "total_entries":    {"type": "integer", "example": 24},
                    "detected":         {"type": "integer", "example": 18},
                    "missed":           {"type": "integer", "example": 4},
                    "partial":          {"type": "integer", "example": 2},
                    "detection_rate":   {"type": "number",  "format": "float", "example": 0.75},
                    "tactic_breakdown": {
                        "type": "object",
                        "additionalProperties": {"type": "integer"},
                        "example": {"Execution": 8, "Persistence": 6},
                    },
                },
            },
            "ExerciseEntry": {
                "type": "object",
                "properties": {
                    "id":                    {"type": "integer", "example": 101},
                    "exercise_id":           {"type": "integer", "example": 1},
                    "ttp_id":                {"type": "integer", "example": 42},
                    "ttp":                   {"$ref": "#/components/schemas/TTP"},
                    "executed_at":           {"type": "string", "format": "date-time", "nullable": True},
                    "tool_used":             {"type": "string", "nullable": True, "example": "Cobalt Strike"},
                    "command_used":          {"type": "string", "nullable": True, "example": "powershell -enc ..."},
                    "source":                {"type": "string", "nullable": True, "example": "10.0.0.5"},
                    "destination":           {"type": "string", "nullable": True, "example": "10.0.0.10"},
                    "red_notes":             {"type": "string", "nullable": True},
                    "detected":              {"type": "boolean", "nullable": True},
                    "detected_at":           {"type": "string", "format": "date-time", "nullable": True},
                    "detection_method":      {"type": "string", "nullable": True, "example": "SIEM alert"},
                    "alert_name":            {"type": "string", "nullable": True, "example": "Suspicious PowerShell"},
                    "response_action":       {"type": "string", "nullable": True},
                    "blue_notes":            {"type": "string", "nullable": True},
                    "outcome":               {"type": "string", "enum": ["detected", "missed", "partial"], "nullable": True},
                    "gap_identified":        {"type": "string", "nullable": True},
                    "attack_path_include":   {"type": "boolean", "example": True},
                    "attack_path_step":      {"type": "integer", "nullable": True, "example": 3},
                    "tags":                  {"type": "array", "items": {"$ref": "#/components/schemas/Tag"}},
                    "time_to_detect_minutes": {"type": "number", "nullable": True, "example": 12.5},
                    "created_at":            {"type": "string", "format": "date-time"},
                    "updated_at":            {"type": "string", "format": "date-time"},
                },
            },
            "EntryImage": {
                "type": "object",
                "properties": {
                    "id":         {"type": "integer", "example": 7},
                    "entry_id":   {"type": "integer", "example": 101},
                    "filename":   {"type": "string",  "example": "screenshot.png"},
                    "mime_type":  {"type": "string",  "example": "image/png"},
                    "caption":    {"type": "string",  "nullable": True, "example": "EDR alert screenshot"},
                    "url":        {"type": "string",  "example": "/api/images/7/data"},
                    "created_at": {"type": "string",  "format": "date-time"},
                },
            },
            # ── Request bodies ────────────────────────────────────────────────
            "LoginRequest": {
                "type": "object",
                "required": ["username", "password"],
                "properties": {
                    "username": {"type": "string", "example": "alice"},
                    "password": {"type": "string", "example": "s3cr3t"},
                },
            },
            "SignupRequest": {
                "type": "object",
                "required": ["username", "password", "role"],
                "properties": {
                    "username": {"type": "string", "example": "alice"},
                    "email":    {"type": "string", "format": "email", "example": "alice@example.com"},
                    "password": {"type": "string", "example": "s3cr3t"},
                    "role":     {"type": "string", "enum": ["red_team", "blue_team"], "example": "red_team"},
                },
            },
            "ExerciseWrite": {
                "type": "object",
                "required": ["name"],
                "properties": {
                    "name":        {"type": "string",  "example": "Q3 Red Team"},
                    "description": {"type": "string",  "example": "Quarterly purple team exercise"},
                    "status":      {"type": "string",  "enum": ["planned", "active", "completed"], "example": "planned"},
                    "start_date":  {"type": "string",  "format": "date", "example": "2026-07-01"},
                    "end_date":    {"type": "string",  "format": "date", "example": "2026-07-05"},
                    "tag_ids":     {"type": "array",   "items": {"type": "integer"}, "example": [1, 3]},
                },
            },
            "EntryWrite": {
                "type": "object",
                "required": ["exercise_id", "ttp_id"],
                "properties": {
                    "exercise_id":         {"type": "integer", "example": 1},
                    "ttp_id":              {"type": "integer", "example": 42},
                    "executed_at":         {"type": "string",  "format": "date-time"},
                    "tool_used":           {"type": "string",  "example": "Cobalt Strike"},
                    "command_used":        {"type": "string",  "example": "powershell -enc ..."},
                    "source":              {"type": "string",  "example": "10.0.0.5"},
                    "destination":         {"type": "string",  "example": "10.0.0.10"},
                    "red_notes":           {"type": "string"},
                    "detected":            {"type": "boolean"},
                    "detected_at":         {"type": "string",  "format": "date-time"},
                    "detection_method":    {"type": "string",  "example": "SIEM alert"},
                    "alert_name":          {"type": "string",  "example": "Suspicious PowerShell"},
                    "response_action":     {"type": "string"},
                    "blue_notes":          {"type": "string"},
                    "outcome":             {"type": "string",  "enum": ["detected", "missed", "partial"]},
                    "gap_identified":      {"type": "string"},
                    "attack_path_include": {"type": "boolean", "example": True},
                    "attack_path_step":    {"type": "integer", "example": 3},
                    "tag_ids":             {"type": "array",   "items": {"type": "integer"}, "example": [2]},
                },
            },
            "AttackPathSteps": {
                "type": "object",
                "required": ["steps"],
                "properties": {
                    "steps": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["entry_id", "attack_path_step"],
                            "properties": {
                                "entry_id":         {"type": "integer", "example": 101},
                                "attack_path_step": {"type": "integer", "example": 2},
                            },
                        },
                    }
                },
            },
            "ImportTemplate": {
                "type": "object",
                "required": ["entries"],
                "properties": {
                    "version": {"type": "integer", "example": 1},
                    "entries": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["mitre_id"],
                            "properties": {
                                "mitre_id":    {"type": "string", "example": "T1059.001"},
                                "tool_used":   {"type": "string", "example": "Cobalt Strike"},
                                "command_used":{"type": "string"},
                            },
                        },
                    },
                },
            },
            "UserUpdate": {
                "type": "object",
                "properties": {
                    "role":        {"type": "string", "enum": ["admin", "red_team", "blue_team"]},
                    "is_approved": {"type": "boolean"},
                    "is_active":   {"type": "boolean"},
                    "email":       {"type": "string", "format": "email"},
                    "password":    {"type": "string", "description": "Provide to reset the user's password"},
                },
            },
        },
        "responses": {
            "Unauthorized": {
                "description": "Missing or invalid JWT token",
                "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Error"}}},
            },
            "Forbidden": {
                "description": "Authenticated but insufficient role",
                "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Error"}}},
            },
            "NotFound": {
                "description": "Resource not found",
                "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Error"}}},
            },
        },
        "parameters": {
            "ExerciseId": {
                "name": "exercise_id", "in": "path", "required": True,
                "schema": {"type": "integer"}, "example": 1,
            },
            "EntryId": {
                "name": "entry_id", "in": "path", "required": True,
                "schema": {"type": "integer"}, "example": 101,
            },
            "TtpId": {
                "name": "ttp_id", "in": "path", "required": True,
                "schema": {"type": "integer"}, "example": 42,
            },
            "TagId": {
                "name": "tag_id", "in": "path", "required": True,
                "schema": {"type": "integer"}, "example": 5,
            },
            "UserId": {
                "name": "user_id", "in": "path", "required": True,
                "schema": {"type": "integer"}, "example": 2,
            },
            "ImageId": {
                "name": "image_id", "in": "path", "required": True,
                "schema": {"type": "integer"}, "example": 7,
            },
        },
    },
    "tags": [
        {"name": "Auth",      "description": "Login, signup, and session management"},
        {"name": "Exercises", "description": "Purple-team exercise lifecycle"},
        {"name": "Entries",   "description": "TTP exercise entries (red + blue team data)"},
        {"name": "TTPs",      "description": "MITRE ATT&CK technique library"},
        {"name": "Tags",      "description": "Labels applied to exercises and entries"},
        {"name": "Tactics",   "description": "MITRE ATT&CK tactics"},
        {"name": "MITRE",     "description": "ATT&CK framework data refresh"},
        {"name": "Images",    "description": "Screenshots attached to exercise entries"},
        {"name": "Admin",     "description": "User management — admin role required"},
    ],
    "paths": {
        # ── AUTH ──────────────────────────────────────────────────────────────
        "/api/auth/login": {
            "post": {
                "tags": ["Auth"],
                "summary": "Log in",
                "description": "Authenticate with username and password. Returns a JWT access token valid for 8 hours.",
                "security": [],
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/LoginRequest"}}},
                },
                "responses": {
                    "200": {
                        "description": "Login successful",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "access_token": {"type": "string"},
                                        "user": {"$ref": "#/components/schemas/User"},
                                    },
                                }
                            }
                        },
                    },
                    "401": {"description": "Invalid credentials"},
                    "403": {"description": "Account not approved or disabled"},
                },
            }
        },
        "/api/auth/signup": {
            "post": {
                "tags": ["Auth"],
                "summary": "Request an account",
                "description": "Create a new account. Accounts start as unapproved and cannot log in until an admin approves them.",
                "security": [],
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/SignupRequest"}}},
                },
                "responses": {
                    "201": {
                        "description": "Account created, awaiting approval",
                        "content": {
                            "application/json": {
                                "schema": {"type": "object", "properties": {"message": {"type": "string"}}}
                            }
                        },
                    },
                    "400": {"$ref": "#/components/responses/Forbidden"},
                    "409": {"description": "Username or email already taken"},
                },
            }
        },
        "/api/auth/me": {
            "get": {
                "tags": ["Auth"],
                "summary": "Get current user",
                "description": "Returns the profile of the authenticated user.",
                "responses": {
                    "200": {
                        "description": "Current user",
                        "content": {"application/json": {"schema": {"$ref": "#/components/schemas/User"}}},
                    },
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                },
            }
        },
        "/api/auth/logout": {
            "post": {
                "tags": ["Auth"],
                "summary": "Log out",
                "description": "Invalidates the session. The client should discard the token.",
                "responses": {
                    "200": {"description": "Logged out"},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                },
            }
        },
        # ── EXERCISES ─────────────────────────────────────────────────────────
        "/api/exercises/": {
            "get": {
                "tags": ["Exercises"],
                "summary": "List exercises",
                "responses": {
                    "200": {
                        "description": "List of exercises",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "data":  {"type": "array", "items": {"$ref": "#/components/schemas/Exercise"}},
                                        "total": {"type": "integer"},
                                    },
                                }
                            }
                        },
                    },
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                },
            },
            "post": {
                "tags": ["Exercises"],
                "summary": "Create exercise",
                "description": "Roles: admin, red_team",
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ExerciseWrite"}}},
                },
                "responses": {
                    "201": {
                        "description": "Exercise created",
                        "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Exercise"}}},
                    },
                    "400": {"$ref": "#/components/responses/NotFound"},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                },
            },
        },
        "/api/exercises/{exercise_id}": {
            "parameters": [{"$ref": "#/components/parameters/ExerciseId"}],
            "get": {
                "tags": ["Exercises"],
                "summary": "Get exercise",
                "responses": {
                    "200": {"description": "Exercise", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Exercise"}}}},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
            "put": {
                "tags": ["Exercises"],
                "summary": "Update exercise",
                "description": "Roles: admin, red_team",
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ExerciseWrite"}}},
                },
                "responses": {
                    "200": {"description": "Updated exercise", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Exercise"}}}},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
            "delete": {
                "tags": ["Exercises"],
                "summary": "Delete exercise",
                "description": "Deletes the exercise and all its entries. Roles: admin only.",
                "responses": {
                    "204": {"description": "Deleted"},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
        },
        "/api/exercises/{exercise_id}/summary": {
            "parameters": [{"$ref": "#/components/parameters/ExerciseId"}],
            "get": {
                "tags": ["Exercises"],
                "summary": "Get exercise summary",
                "description": "Returns detection statistics and tactic breakdown for the exercise.",
                "responses": {
                    "200": {"description": "Summary", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ExerciseSummary"}}}},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
        },
        "/api/exercises/{exercise_id}/entries": {
            "parameters": [{"$ref": "#/components/parameters/ExerciseId"}],
            "get": {
                "tags": ["Exercises"],
                "summary": "List entries for an exercise",
                "parameters": [
                    {"name": "outcome", "in": "query", "schema": {"type": "string", "enum": ["detected", "missed", "partial"]}, "description": "Filter by outcome"},
                    {"name": "tactic",  "in": "query", "schema": {"type": "string"}, "description": "Filter by tactic name"},
                ],
                "responses": {
                    "200": {
                        "description": "Entry list",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "data":  {"type": "array", "items": {"$ref": "#/components/schemas/ExerciseEntry"}},
                                        "total": {"type": "integer"},
                                    },
                                }
                            }
                        },
                    },
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
        },
        "/api/exercises/{exercise_id}/import-template": {
            "parameters": [{"$ref": "#/components/parameters/ExerciseId"}],
            "post": {
                "tags": ["Exercises"],
                "summary": "Import entries from a template",
                "description": "Bulk-creates entries from a JSON template exported by this application. Roles: admin, red_team.",
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ImportTemplate"}}},
                },
                "responses": {
                    "201": {
                        "description": "Import result",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "imported": {"type": "integer"},
                                        "skipped":  {"type": "array", "items": {"type": "object", "properties": {"mitre_id": {"type": "string"}, "reason": {"type": "string"}}}},
                                    },
                                }
                            }
                        },
                    },
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
        },
        "/api/exercises/{exercise_id}/import-navigator": {
            "parameters": [{"$ref": "#/components/parameters/ExerciseId"}],
            "post": {
                "tags": ["Exercises"],
                "summary": "Import entries from a MITRE ATT&CK Navigator layer",
                "description": (
                    "Accepts a Navigator layer JSON file (`techniques` array). "
                    "Enabled techniques are matched to the TTP library (sub-technique falls back to parent). "
                    "Each imported entry is added to the attack path. Roles: admin, red_team."
                ),
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["techniques"],
                                "properties": {
                                    "name":       {"type": "string"},
                                    "techniques": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "techniqueID": {"type": "string", "example": "T1059.001"},
                                                "enabled":     {"type": "boolean"},
                                                "comment":     {"type": "string"},
                                            },
                                        },
                                    },
                                },
                            }
                        }
                    },
                },
                "responses": {
                    "201": {
                        "description": "Import result",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "imported": {"type": "integer"},
                                        "skipped":  {"type": "array", "items": {"type": "object"}},
                                    },
                                }
                            }
                        },
                    },
                    "400": {"description": "Invalid Navigator layer"},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                },
            },
        },
        "/api/exercises/{exercise_id}/attack-path": {
            "parameters": [{"$ref": "#/components/parameters/ExerciseId"}],
            "patch": {
                "tags": ["Exercises"],
                "summary": "Reorder attack path",
                "description": "Update the step numbers of entries in the attack path. Roles: admin, red_team.",
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/AttackPathSteps"}}},
                },
                "responses": {
                    "200": {"description": "OK", "content": {"application/json": {"schema": {"type": "object", "properties": {"ok": {"type": "boolean"}}}}}},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                },
            },
        },
        "/api/exercises/{exercise_id}/attack-path/{entry_id}": {
            "parameters": [
                {"$ref": "#/components/parameters/ExerciseId"},
                {"$ref": "#/components/parameters/EntryId"},
            ],
            "delete": {
                "tags": ["Exercises"],
                "summary": "Remove entry from attack path",
                "description": "Sets `attack_path_include=false` and clears the step number. Roles: admin, red_team.",
                "responses": {
                    "200": {"description": "Updated entry", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ExerciseEntry"}}}},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
        },
        # ── ENTRIES ───────────────────────────────────────────────────────────
        "/api/entries/": {
            "post": {
                "tags": ["Entries"],
                "summary": "Create entry",
                "description": (
                    "Create a new TTP entry in an exercise. Roles: admin, red_team.\n\n"
                    "**Field restrictions on update (not create):** red_team may only update red-team fields; "
                    "blue_team may only update blue-team fields."
                ),
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/EntryWrite"}}},
                },
                "responses": {
                    "201": {"description": "Entry created", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ExerciseEntry"}}}},
                    "400": {"$ref": "#/components/responses/NotFound"},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                },
            }
        },
        "/api/entries/{entry_id}": {
            "parameters": [{"$ref": "#/components/parameters/EntryId"}],
            "get": {
                "tags": ["Entries"],
                "summary": "Get entry",
                "responses": {
                    "200": {"description": "Entry", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ExerciseEntry"}}}},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
            "put": {
                "tags": ["Entries"],
                "summary": "Update entry",
                "description": (
                    "All roles can call this endpoint, but field writes are filtered by role:\n\n"
                    "- `red_team` — may only update: `ttp_id`, `executed_at`, `tool_used`, `command_used`, `source`, `destination`, `red_notes`, `attack_path_include`, `attack_path_step`, `tag_ids`\n"
                    "- `blue_team` — may only update: `detected`, `detected_at`, `detection_method`, `alert_name`, `response_action`, `blue_notes`, `outcome`, `gap_identified`\n"
                    "- `admin` — no restrictions"
                ),
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/EntryWrite"}}},
                },
                "responses": {
                    "200": {"description": "Updated entry", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ExerciseEntry"}}}},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
            "delete": {
                "tags": ["Entries"],
                "summary": "Delete entry",
                "description": "Roles: admin, red_team",
                "responses": {
                    "204": {"description": "Deleted"},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
        },
        # ── TTPs ──────────────────────────────────────────────────────────────
        "/api/ttps/": {
            "get": {
                "tags": ["TTPs"],
                "summary": "List TTPs",
                "parameters": [
                    {"name": "search",   "in": "query", "schema": {"type": "string"}, "description": "Full-text search on MITRE ID and technique name"},
                    {"name": "tactic",   "in": "query", "schema": {"type": "string"}, "description": "Filter by tactic name"},
                    {"name": "platform", "in": "query", "schema": {"type": "string"}, "description": "Filter by platform (e.g. Windows)"},
                ],
                "responses": {
                    "200": {
                        "description": "TTP list",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "data":    {"type": "array", "items": {"$ref": "#/components/schemas/TTP"}},
                                        "total":   {"type": "integer"},
                                        "tactics": {"type": "array", "items": {"type": "string"}},
                                    },
                                }
                            }
                        },
                    },
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                },
            },
            "post": {
                "tags": ["TTPs"],
                "summary": "Create TTP",
                "description": "Roles: admin only.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["mitre_id", "name", "tactic"],
                                "properties": {
                                    "mitre_id":    {"type": "string", "example": "T1059.001"},
                                    "name":        {"type": "string", "example": "PowerShell"},
                                    "tactic":      {"type": "string", "example": "Execution"},
                                    "description": {"type": "string"},
                                    "platform":    {"type": "string", "example": "Windows,Linux"},
                                },
                            }
                        }
                    },
                },
                "responses": {
                    "201": {"description": "TTP created", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/TTP"}}}},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                },
            },
        },
        "/api/ttps/{ttp_id}": {
            "parameters": [{"$ref": "#/components/parameters/TtpId"}],
            "get": {
                "tags": ["TTPs"],
                "summary": "Get TTP",
                "responses": {
                    "200": {"description": "TTP", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/TTP"}}}},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
            "put": {
                "tags": ["TTPs"],
                "summary": "Update TTP",
                "description": "Roles: admin only.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "name":        {"type": "string"},
                                    "tactic":      {"type": "string"},
                                    "description": {"type": "string"},
                                    "platform":    {"type": "string"},
                                },
                            }
                        }
                    },
                },
                "responses": {
                    "200": {"description": "Updated TTP", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/TTP"}}}},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
            "delete": {
                "tags": ["TTPs"],
                "summary": "Delete TTP",
                "description": "Roles: admin only.",
                "responses": {
                    "204": {"description": "Deleted"},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
        },
        # ── TAGS ──────────────────────────────────────────────────────────────
        "/api/tags/": {
            "get": {
                "tags": ["Tags"],
                "summary": "List tags",
                "responses": {
                    "200": {
                        "description": "Tag list",
                        "content": {
                            "application/json": {
                                "schema": {"type": "object", "properties": {"data": {"type": "array", "items": {"$ref": "#/components/schemas/Tag"}}}}
                            }
                        },
                    },
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                },
            },
            "post": {
                "tags": ["Tags"],
                "summary": "Create tag",
                "description": "Roles: admin, red_team.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["name"],
                                "properties": {
                                    "name":  {"type": "string", "example": "Phishing"},
                                    "color": {"type": "string", "example": "#6366f1"},
                                },
                            }
                        }
                    },
                },
                "responses": {
                    "201": {"description": "Tag created", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Tag"}}}},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                },
            },
        },
        "/api/tags/{tag_id}": {
            "parameters": [{"$ref": "#/components/parameters/TagId"}],
            "put": {
                "tags": ["Tags"],
                "summary": "Update tag",
                "description": "Roles: admin, red_team.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"type": "object", "properties": {"name": {"type": "string"}, "color": {"type": "string"}}}
                        }
                    },
                },
                "responses": {
                    "200": {"description": "Updated tag", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Tag"}}}},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
            "delete": {
                "tags": ["Tags"],
                "summary": "Delete tag",
                "description": "Roles: admin only.",
                "responses": {
                    "204": {"description": "Deleted"},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
        },
        # ── TACTICS ───────────────────────────────────────────────────────────
        "/api/tactics/": {
            "get": {
                "tags": ["Tactics"],
                "summary": "List MITRE ATT&CK tactics",
                "responses": {
                    "200": {
                        "description": "Tactic list",
                        "content": {
                            "application/json": {
                                "schema": {"type": "object", "properties": {"data": {"type": "array", "items": {"$ref": "#/components/schemas/Tactic"}}}}
                            }
                        },
                    },
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                },
            }
        },
        # ── MITRE ─────────────────────────────────────────────────────────────
        "/api/mitre/refresh": {
            "post": {
                "tags": ["MITRE"],
                "summary": "Refresh ATT&CK data",
                "description": "Downloads the latest MITRE ATT&CK enterprise framework and updates the TTP and Tactic tables. Roles: admin only.",
                "responses": {
                    "200": {
                        "description": "Refresh result",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "tactics_updated":    {"type": "integer"},
                                        "techniques_updated": {"type": "integer"},
                                    },
                                }
                            }
                        },
                    },
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "500": {"description": "Upstream MITRE fetch failed"},
                },
            }
        },
        # ── IMAGES ────────────────────────────────────────────────────────────
        "/api/images/": {
            "get": {
                "tags": ["Images"],
                "summary": "List images for an entry",
                "parameters": [
                    {"name": "entry_id", "in": "query", "required": True, "schema": {"type": "integer"}, "description": "Entry ID to fetch images for"}
                ],
                "responses": {
                    "200": {
                        "description": "Image list",
                        "content": {"application/json": {"schema": {"type": "array", "items": {"$ref": "#/components/schemas/EntryImage"}}}},
                    },
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                },
            },
            "post": {
                "tags": ["Images"],
                "summary": "Upload an image",
                "description": "Attach a screenshot or image to an entry (max 10 MB). Roles: admin, red_team.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "multipart/form-data": {
                            "schema": {
                                "type": "object",
                                "required": ["entry_id", "file"],
                                "properties": {
                                    "entry_id": {"type": "integer"},
                                    "file":     {"type": "string", "format": "binary"},
                                },
                            }
                        }
                    },
                },
                "responses": {
                    "201": {"description": "Image uploaded", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/EntryImage"}}}},
                    "400": {"description": "Missing file or invalid MIME type"},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "413": {"description": "File exceeds 10 MB limit"},
                },
            },
        },
        "/api/images/{image_id}": {
            "parameters": [{"$ref": "#/components/parameters/ImageId"}],
            "patch": {
                "tags": ["Images"],
                "summary": "Update image caption",
                "description": "Roles: admin, red_team.",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"type": "object", "properties": {"caption": {"type": "string", "nullable": True}}}
                        }
                    },
                },
                "responses": {
                    "200": {"description": "Updated image", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/EntryImage"}}}},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
            "delete": {
                "tags": ["Images"],
                "summary": "Delete image",
                "description": "Roles: admin, red_team.",
                "responses": {
                    "204": {"description": "Deleted"},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
        },
        # ── ADMIN ─────────────────────────────────────────────────────────────
        "/api/admin/users": {
            "get": {
                "tags": ["Admin"],
                "summary": "List all users",
                "description": "Returns all user accounts ordered by approval status then creation date. Roles: admin only.",
                "responses": {
                    "200": {
                        "description": "User list",
                        "content": {
                            "application/json": {
                                "schema": {"type": "object", "properties": {"data": {"type": "array", "items": {"$ref": "#/components/schemas/User"}}}}
                            }
                        },
                    },
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                },
            }
        },
        "/api/admin/users/{user_id}": {
            "parameters": [{"$ref": "#/components/parameters/UserId"}],
            "put": {
                "tags": ["Admin"],
                "summary": "Update user",
                "description": "Update role, approval status, active status, email, or password. Roles: admin only.",
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": {"$ref": "#/components/schemas/UserUpdate"}}},
                },
                "responses": {
                    "200": {"description": "Updated user", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/User"}}}},
                    "400": {"description": "Invalid role or empty password"},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                    "409": {"description": "Email already in use"},
                },
            },
            "delete": {
                "tags": ["Admin"],
                "summary": "Delete user",
                "description": "Permanently deletes the account. Cannot delete your own account. Roles: admin only.",
                "responses": {
                    "204": {"description": "Deleted"},
                    "400": {"description": "Cannot delete your own account"},
                    "401": {"$ref": "#/components/responses/Unauthorized"},
                    "403": {"$ref": "#/components/responses/Forbidden"},
                    "404": {"$ref": "#/components/responses/NotFound"},
                },
            },
        },
    },
}
