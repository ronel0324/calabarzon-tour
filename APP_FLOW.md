# App Flow Diagram - Virtual Tour CALABARZON

## Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      App.js                             │
│                (Navigation Container)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │         React Navigation Stack                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐    ┌──────────┐    ┌──────────┐
    │ Home   │    │ Destin.  │    │ Progress │
    │ Screen │    │   List   │    │  Screen  │
    └────────┘    └──────────┘    └──────────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   Database Service     │
            │   (SQLite - database.js)│
            └────────────────────────┘
```

## Screen Flow

```
┌──────────────┐
│  Home Screen │  (Landing page)
└──────┬───────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐  ┌──────────────┐
│ Destination │  │ Add Destin.  │
│    List     │  │    Screen    │
└──────┬──────┘  └──────┬───────┘
       │                │
       │                │ (Submit)
       │                ▼
       │         ┌──────────────┐
       │         │  Destination │
       │         │     List     │
       │         └──────────────┘
       │
       ▼
┌──────────────┐
│ Destination  │
│    Detail    │
└──────┬───────┘
       │
       ├────────────────┬────────────┐
       │                │            │
       ▼                ▼            ▼
┌─────────────┐  ┌──────────┐  ┌──────────┐
│ Edit Dest.  │  │   Quiz   │  │ Progress │
│   Screen    │  │Interface │  │  Track   │
└─────────────┘  └──────────┘  └──────────┘
```

## User Journey: Browse Destinations

```
Start
  │
  ├─→ Open App
  │     │
  │     ├─→ Database Initialized
  │     │     │
  │     │     └─→ Sample Data Loaded (if first time)
  │     │
  │     └─→ Navigate to Home Screen
  │           │
  │           └─→ Tap "Browse Destinations"
  │                 │
  │                 └─→ Destination List Screen
  │                       │
  │                       ├─→ Search (optional)
  │                       │
  │                       ├─→ Filter by Category (optional)
  │                       │
  │                       └─→ Tap on Destination Card
  │                             │
  │                             └─→ Destination Detail Screen
  │                                   │
  │                                   └─→ View Information
  │
End
```

## User Journey: Add New Destination

```
Start
  │
  ├─→ Home Screen
  │     │
  │     └─→ Tap "Add Destination"
  │           │
  │           └─→ Add Destination Screen
  │                 │
  │                 ├─→ Enter Name (required)
  │                 │
  │                 ├─→ Select Category (required)
  │                 │
  │                 ├─→ Enter Address (required)
  │                 │
  │                 ├─→ Enter Description (required)
  │                 │
  │                 ├─→ Add Historical Info (optional)
  │                 │
  │                 ├─→ Add Cultural Significance (optional)
  │                 │
  │                 ├─→ Add Image (optional)
  │                 │     │
  │                 │     ├─→ Pick from Gallery
  │                 │     │     or
  │                 │     └─→ Enter Image URL
  │                 │
  │                 ├─→ Tap "Add Destination"
  │                 │     │
  │                 │     ├─→ Validation Check
  │                 │     │     │
  │                 │     │     ├─→ Valid: Save to Database
  │                 │     │     │     │
  │                 │     │     │     └─→ Success Message
  │                 │     │     │           │
  │                 │     │     │           └─→ Navigate Back to List
  │                 │     │     │
  │                 │     │     └─→ Invalid: Show Error
  │                 │     │
  │                 │     └─→ Back to Form
  │                 │
  │                 └─→ Tap "Cancel"
  │                       │
  │                       └─→ Navigate Back
  │
End
```

## User Journey: Take Quiz

```
Start
  │
  ├─→ Destination Detail Screen
  │     │
  │     └─→ Tap "Take Quiz"
  │           │
  │           ├─→ Check if quiz available
  │           │     │
  │           │     ├─→ No quiz: Show alert
  │           │     │
  │           │     └─→ Quiz available: Load questions
  │           │
  │           └─→ Quiz Interface
  │                 │
  │                 └─→ For each question:
  │                       │
  │                       ├─→ Display question & options
  │                       │
  │                       ├─→ User selects answer
  │                       │
  │                       ├─→ Tap "Next Question"
  │                       │     │
  │                       │     ├─→ Validate selection
  │                       │     │     │
  │                       │     │     ├─→ No selection: Show alert
  │                       │     │     │
  │                       │     │     └─→ Has selection: Continue
  │                       │     │
  │                       │     └─→ Check answer
  │                       │           │
  │                       │           ├─→ Correct: Increment score
  │                       │           │
  │                       │           └─→ Incorrect: Continue
  │                       │
  │                       └─→ Last question?
  │                             │
  │                             ├─→ No: Next question
  │                             │
  │                             └─→ Yes: Calculate results
  │                                   │
  │                                   ├─→ Show score & percentage
  │                                   │
  │                                   ├─→ Check if passed (≥60%)
  │                                   │     │
  │                                   │     ├─→ Passed: Mark completed
  │                                   │     │
  │                                   │     └─→ Failed: Mark in progress
  │                                   │
  │                                   ├─→ Save progress to database
  │                                   │
  │                                   └─→ Quiz Result Screen
  │                                         │
  │                                         ├─→ Tap "Back to Details"
  │                                         │     │
  │                                         │     └─→ Return to Detail Screen
  │                                         │
  │                                         └─→ Tap "Try Again"
  │                                               │
  │                                               └─→ Restart Quiz
  │
End
```

## User Journey: View Progress

```
Start
  │
  ├─→ Home Screen
  │     │
  │     └─→ Tap "My Progress"
  │           │
  │           └─→ Progress Screen
  │                 │
  │                 ├─→ Load all progress from database
  │                 │
  │                 ├─→ Display Statistics
  │                 │     │
  │                 │     ├─→ Total Quiz Attempts
  │                 │     │
  │                 │     ├─→ Completed Destinations
  │                 │     │
  │                 │     └─→ Average Score
  │                 │
  │                 ├─→ Filter Options
  │                 │     │
  │                 │     ├─→ Tap "All Progress"
  │                 │     │     │
  │                 │     │     └─→ Show all entries
  │                 │     │
  │                 │     └─→ Tap "Completed Only"
  │                 │           │
  │                 │           └─→ Show completed entries
  │                 │
  │                 ├─→ Display Progress List
  │                 │     │
  │                 │     └─→ For each entry:
  │                 │           │
  │                 │           ├─→ Destination name
  │                 │           │
  │                 │           ├─→ Score percentage
  │                 │           │
  │                 │           ├─→ Completion status
  │                 │           │
  │                 │           └─→ Date completed
  │                 │
  │                 └─→ Tap on progress entry
  │                       │
  │                       └─→ Navigate to Destination Detail
  │
End
```

## Database Operations Flow

```
┌─────────────────────────────────────────────────┐
│           Database Initialization               │
│  (Runs once on app first launch)                │
└─────────────────┬───────────────────────────────┘
                  │
                  ├─→ Create "destinations" table
                  │
                  ├─→ Create "quiz_questions" table
                  │
                  ├─→ Create "user_progress" table
                  │
                  └─→ Check if sample data exists
                        │
                        ├─→ Exists: Skip
                        │
                        └─→ Not exists: Seed sample data
                              │
                              ├─→ Insert 5 sample destinations
                              │
                              └─→ Insert 10 sample quiz questions
```

## CRUD Operations

```
┌─────────────┐
│   CREATE    │  addDestination(data)
└─────────────┘        │
                       ├─→ Validate data
                       │
                       ├─→ INSERT into destinations table
                       │
                       └─→ Return new ID

┌─────────────┐
│    READ     │  getAllDestinations()
└─────────────┘        │
                       ├─→ SELECT * FROM destinations
                       │
                       └─→ Return array of destinations
                       
                  getDestinationById(id)
                       │
                       ├─→ SELECT * WHERE id = ?
                       │
                       └─→ Return destination object

┌─────────────┐
│   UPDATE    │  updateDestination(id, data)
└─────────────┘        │
                       ├─→ Validate data
                       │
                       ├─→ UPDATE destinations SET ... WHERE id = ?
                       │
                       └─→ Return success

┌─────────────┐
│   DELETE    │  deleteDestination(id)
└─────────────┘        │
                       ├─→ DELETE FROM destinations WHERE id = ?
                       │
                       └─→ Return success
```

## Search & Filter Flow

```
┌─────────────────────────────────────┐
│  User types in search box           │
└──────────────┬──────────────────────┘
               │
               ├─→ searchDestinations(query)
               │     │
               │     ├─→ SELECT * WHERE name LIKE '%query%'
               │     │                 OR description LIKE '%query%'
               │     │                 OR address LIKE '%query%'
               │     │
               │     └─→ Return filtered results
               │
               └─→ Update destination list

┌─────────────────────────────────────┐
│  User taps category filter          │
└──────────────┬──────────────────────┘
               │
               ├─→ filterDestinationsByCategory(category)
               │     │
               │     ├─→ SELECT * WHERE category = ?
               │     │
               │     └─→ Return filtered results
               │
               └─→ Update destination list
```

## Progress Tracking Flow

```
┌─────────────────────────────────────┐
│  User completes quiz                │
└──────────────┬──────────────────────┘
               │
               ├─→ Calculate score percentage
               │
               ├─→ Determine if completed (≥60%)
               │
               ├─→ saveProgress(destinationId, score, completed)
               │     │
               │     ├─→ Check if progress exists
               │     │     │
               │     │     ├─→ Exists: UPDATE user_progress
               │     │     │
               │     │     └─→ Not exists: INSERT into user_progress
               │     │
               │     └─→ Save with timestamp
               │
               └─→ Update UI with new progress
```

## Technology Stack Layers

```
┌─────────────────────────────────────────────┐
│          User Interface Layer               │
│  (React Native Components & Screens)        │
└──────────────┬──────────────────────────────┘
               │
┌──────────────┴──────────────────────────────┐
│       Navigation Layer                      │
│  (React Navigation - Stack Navigator)       │
└──────────────┬──────────────────────────────┘
               │
┌──────────────┴──────────────────────────────┐
│       Business Logic Layer                  │
│  (Screen Components with State Management)  │
└──────────────┬──────────────────────────────┘
               │
┌──────────────┴──────────────────────────────┐
│       Data Access Layer                     │
│  (Database Service - database.js)           │
└──────────────┬──────────────────────────────┘
               │
┌──────────────┴──────────────────────────────┐
│       Data Storage Layer                    │
│  (SQLite Database - expo-sqlite)            │
└─────────────────────────────────────────────┘
```

## Component Relationships

```
App.js
├── HomeScreen
│   └── Navigation buttons to:
│       ├── DestinationListScreen
│       ├── AddDestinationScreen
│       └── ProgressScreen
│
├── DestinationListScreen
│   ├── Uses: database.js
│   │   ├── getAllDestinations()
│   │   ├── searchDestinations()
│   │   └── filterDestinationsByCategory()
│   │
│   └── Navigation to:
│       ├── DestinationDetailScreen
│       ├── EditDestinationScreen
│       └── AddDestinationScreen
│
├── DestinationDetailScreen
│   ├── Uses: database.js
│   │   ├── getDestinationById()
│   │   ├── getQuizQuestionsByDestination()
│   │   ├── saveProgress()
│   │   └── getProgress()
│   │
│   └── Navigation to:
│       └── EditDestinationScreen
│
├── AddDestinationScreen
│   ├── Uses: database.js
│   │   └── addDestination()
│   │
│   └── Uses: expo-image-picker
│       └── launchImageLibraryAsync()
│
├── EditDestinationScreen
│   ├── Uses: database.js
│   │   ├── getDestinationById()
│   │   └── updateDestination()
│   │
│   └── Uses: expo-image-picker
│       └── launchImageLibraryAsync()
│
└── ProgressScreen
    ├── Uses: database.js
    │   ├── getAllProgress()
    │   └── getCompletedDestinations()
    │
    └── Navigation to:
        └── DestinationDetailScreen
```

---

This document provides a visual representation of how the app flows and how different components interact with each other. Use this as a reference when understanding or modifying the application structure.
