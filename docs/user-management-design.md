
# User Management Subsystem – Sprint 1

## 1. Use Case Diagram

```mermaid
flowchart LR
    Student([Student])
    Admin([Administrator])

    subgraph System["UTM SE&AT - User Management"]
        UC1((Register Account))
        UC2((Login))
        UC3((View Profile))
        UC4((Update Profile))
        UC5((Logout))
        UC6((Access Student Features))
        UC7((Access Admin Features))
        UC8((Authenticate User))
        UC9((Verify User Role))
    end

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6
    Admin --> UC2
    Admin --> UC5
    Admin --> UC7
    UC2 -.-> UC8
    UC2 -.-> UC9
    UC6 -.-> UC9
    UC7 -.-> UC9
```

## 2. Activity Diagram – Registration and Login

```mermaid
flowchart TD
    A([Start]) --> B[Open Application]
    B --> C{Already have an account?}
    C -- No --> D[Open Registration Form]
    D --> E[Enter Name, Email and Password]
    E --> F[Validate Input]
    F --> G{Input valid?}
    G -- No --> H[Display Validation Error]
    H --> D
    G -- Yes --> I[Check Existing Email]
    I --> J{Email already exists?}
    J -- Yes --> K[Display Email Already Registered]
    K --> D
    J -- No --> L[Hash Password and Create Account]
    L --> M[Display Registration Success]
    M --> N[Open Login Page]
    C -- Yes --> N
    N --> O[Enter Email and Password]
    O --> P[Verify Credentials]
    P --> Q{Credentials valid?}
    Q -- No --> R[Display Login Error]
    R --> N
    Q -- Yes --> S[Generate Authentication Token]
    S --> T[Retrieve User Role]
    T --> U{User Role?}
    U -- Student --> V[Open Student Home]
    U -- Admin --> W[Open Admin Home]
    V --> X([End])
    W --> X
```

## 3. Initial ERD – User Management

```mermaid
erDiagram
    USERS {
        INT user_id PK
        VARCHAR student_id
        VARCHAR full_name
        VARCHAR email UK
        VARCHAR password_hash
        ENUM role
        DATETIME created_at
        DATETIME updated_at
    }
```

## 4. UI/UX Wireframe Components

### Register Page
- UTM SE&AT title
- Student ID field
- Full name field
- Email address field
- Password field
- Create Account button
- Login link

### Login Page
- Email address field
- Password field
- Login button
- Register link
- Error message area

### Student Home
- Welcome message
- Cafeteria shortcut
- Seat availability shortcut
- My Profile
- Logout

### Admin Home
- Admin dashboard
- Manage Users
- Manage Cafeterias
- Manage Seats
- My Profile
- Logout

### Profile Page
- Student ID
- Full name
- Email
- Role
- Update Profile button
