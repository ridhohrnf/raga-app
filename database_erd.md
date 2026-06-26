# Database ERD & Optimization Documentation

This document describes the Entity-Relationship Diagram (ERD) and the query optimization strategy for the Raga database.

## Entity Relationship Diagram (ERD)

The following Mermaid diagram visualizes the database tables and their relationships.

```mermaid
erDiagram
    users ||--o{ workouts : "has"
    users ||--o{ progress_images : "uploads"
    users ||--o{ daily_activities : "logs"
    users ||--o{ password_resets : "requests"
    users ||--o{ food_items : "creates custom"
    users ||--o{ logged_meals : "logs"
    users ||--o{ daily_targets : "sets"
    users ||--o{ workout_templates : "saves"
    users ||--o{ daily_records : "records daily"

    workouts ||--o{ exercises : "contains"
    exercises ||--o{ sets : "has"
    workout_templates ||--o{ template_exercises : "contains"

    users {
        int id PK
        varchar username UK
        varchar password
        timestamp created_at
        numeric weight "NUMERIC(5,2)"
        numeric height "NUMERIC(5,2)"
        int age
        varchar gender
        varchar activity_level
        varchar fitness_goal
        varchar workout_program
    }

    workouts {
        int id PK
        int user_id FK
        varchar name
        timestamp date
        text notes
        boolean completed
    }

    exercises {
        int id PK
        int workout_id FK
        varchar name
        varchar category
        text notes
    }

    sets {
        int id PK
        int exercise_id FK
        int set_number
        numeric weight "NUMERIC(6,2)"
        int reps
        int rpe
        boolean completed
    }

    progress_images {
        int id PK
        int user_id FK
        text image_data
        text notes
        timestamp created_at
    }

    daily_activities {
        int id PK
        int user_id FK
        date date
        int steps
        int calories
        numeric distance "NUMERIC(6,2)"
        timestamp created_at
    }

    password_resets {
        int id PK
        int user_id FK
        varchar token UK
        timestamp expires_at
    }

    food_items {
        int id PK
        int user_id FK "nullable (null = default system foods)"
        varchar name
        numeric calories "NUMERIC(6,2)"
        numeric protein "NUMERIC(6,2)"
        numeric carbs "NUMERIC(6,2)"
        numeric fat "NUMERIC(6,2)"
        numeric serving_g "NUMERIC(6,2)"
        timestamp created_at
    }

    logged_meals {
        int id PK
        int user_id FK
        varchar food_name
        numeric weight_g "NUMERIC(6,2)"
        numeric calories "NUMERIC(6,2)"
        numeric protein "NUMERIC(6,2)"
        numeric carbs "NUMERIC(6,2)"
        numeric fat "NUMERIC(6,2)"
        date logged_date
        timestamp created_at
        text image_data
        varchar meal_time
    }

    daily_targets {
        int id PK
        int user_id FK
        date logged_date
        int target_calories
        int target_protein
        int target_carbs
        int target_fat
        timestamp created_at
    }

    workout_templates {
        int id PK
        int user_id FK
        varchar name
        timestamp created_at
    }

    template_exercises {
        int id PK
        int template_id FK
        varchar name
        varchar category
        int order_index
        text sets "JSON serialized"
    }

    daily_records {
        int id PK
        int user_id FK
        date date
        numeric weight "NUMERIC(5,2)"
        varchar fitness_goal
        int tdee
        int target_calories
        timestamp created_at
        numeric body_fat "NUMERIC(5,2)"
        numeric neck "NUMERIC(5,2)"
        numeric waist "NUMERIC(5,2)"
        numeric hip "NUMERIC(5,2)"
    }
```

---

## Query Optimization Strategy

### 1. Database Indexing (Implemented)
To optimize standard SQL queries and joins across all features (especially in the main concurrent data loader `app/api/init-data/route.js`), indexes have been added to the database:

| Table | Index Name | Index Columns | Purpose |
|---|---|---|---|
| **workouts** | `idx_workouts_user_id` | `(user_id)` | Speeds up filtering workouts by user. |
| | `idx_workouts_date` | `(date)` | Speeds up sorting/filtering workouts by date. |
| | `idx_workouts_user_date` | `(user_id, date DESC)` | Optimizes dashboard query loading workouts chronologically. |
| **exercises** | `idx_exercises_workout_id` | `(workout_id)` | Optimizes nested queries joining exercises to workouts. |
| **sets** | `idx_sets_exercise_id` | `(exercise_id)` | Optimizes nested queries joining sets to exercises. |
| | `idx_sets_completed` | `(completed)` | Speeds up personal record (PR) aggregations (`completed = TRUE`). |
| **progress_images** | `idx_progress_images_user_id` | `(user_id)` | Speeds up progress picture fetches per user. |
| | `idx_progress_images_created_at`| `(created_at)` | Speeds up sorting progress images by date. |
| **daily_activities**| `idx_daily_activities_user_id` | `(user_id)` | Speeds up activity summaries per user. |
| | `idx_daily_activities_date` | `(date)` | Speeds up daily metrics calculations. |
| | `idx_daily_activities_user_date`| `(user_id, date)` | Optimizes fetching activity logs for a specific day. |
| **password_resets**| `idx_password_resets_user_id` | `(user_id)` | Speeds up password reset lookups. |
| **food_items** | `idx_food_items_user_id` | `(user_id)` | Speeds up loading custom food items + default system food items. |
| **logged_meals** | `idx_logged_meals_user_id` | `(user_id)` | Speeds up user calorie logs retrieval. |
| | `idx_logged_meals_logged_date`| `(logged_date)` | Speeds up dashboard nutrition summaries per date. |
| | `idx_logged_meals_user_date` | `(user_id, logged_date)` | Optimizes fetching food logs for specific user diaries. |
| **daily_targets**| `idx_daily_targets_user_id` | `(user_id)` | Speeds up calorie target fetches. |
| | `idx_daily_targets_logged_date`| `(logged_date)` | Speeds up calorie target queries. |
| **workout_templates**| `idx_workout_templates_user_id`| `(user_id)` | Speeds up fetching workout templates. |
| **template_exercises**| `idx_template_exercises_template_id`| `(template_id)`| Speeds up nested template exercise joins. |
| **daily_records** | `idx_daily_records_user_id` | `(user_id)` | Speeds up weight logs and body measurement lookups. |
| | `idx_daily_records_date` | `(date)` | Speeds up daily record history sorting. |

### 2. Concurrent Processing (`Promise.all`)
In `app/api/init-data/route.js`, the application fetches all initial dashboard data concurrently using `Promise.all` instead of sequencing them synchronously. With indexes on the database foreign keys, these concurrent queries run with maximum performance, returning the entire dataset to the dashboard in a fraction of a second.

### 3. Cascading Deletes (`ON DELETE CASCADE`)
All foreign keys have been configured with `ON DELETE CASCADE`. When a user deletes their account, or deletes a workout, all related sub-items (exercises, sets, meals, targets) are deleted automatically at the database engine level, preserving relational integrity and preventing database bloating.
