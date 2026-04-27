# Task Management System

## Overview
A full-stack task management application designed to streamline daily task tracking and productivity.

Users can create, update, organize, and monitor tasks with advanced filtering, sorting, and real-time updates. The system also includes smart reminders, visual insights, and performance optimizations for handling large datasets.

---

## Tech Stack
- **Frontend:** Angular (v21), CSS  
- **Backend:** Django (REST APIs)  
- **Database:** MongoDB  
- **ODM:** MongoEngine  

---

## Core Features

### Task Management
- Full CRUD operations (Create, Read, Update, Delete)  
- Quick Status Toggle (mark pending ↔ completed instantly via checkbox)  
- Task Duplication for faster creation of similar tasks  
- Bulk Actions (multi-select → delete / mark completed)  

---

### Smart Organization
- **Advanced Filtering**
  - Search by title/description  
  - Filter by status and priority  

- **Sorting Options**
  - Due date  
  - Priority  
  - Recently created  

- Drag-and-Drop Reordering  
  *(Persistent approach with paginated data)*  

---

### Deadlines & Notifications
- Assign and track due dates  

- **Overdue Detection**
  - Automatic highlighting  
  - “Overdue” label  

- **Email Notifications**
  - Triggered when tasks exceed due date  
  - Implemented using Windows Task Scheduler  

- **Due Date Reminders**
  - Configurable (e.g., 1 hour before)  

---

### User Experience Enhancements
- **Toast Notifications**
  - Real-time success/error feedback  

- **Priority Color Coding**
  - High → Red  
  - Medium → Yellow  
  - Low → Green  

- **Local Storage Draft Save**
  - Prevent data loss in forms  

- **Attachments Support**
  - Upload files/documents to tasks  

---

### Performance & Scalability
- **Pagination**
  - Backend: `limit + skip`  
  - Frontend: load-on-demand  

- Optimized API calls and state handling  

---

### Insights & Export
- **Task Dashboard (Graph)**
  - Total, Completed, Pending, Overdue  

- **Export Tasks**
  - CSV / Excel formats  

---

## Architecture Overview

### Frontend (Angular)
- Task List – Dynamic rendering of tasks  
- Task Card – Reusable UI component  
- Task Filter – search, filters, sorting, bulk actions, export  
- Task Form – Popup UI  
- Task Pagination – Handles paginated data  
- Task Stats – Displays analytics and charts  
- Task Service – API communication layer  
- State Management – Reactive streams (RxJS)  
- Custom Validators – Due date and required fields  

---

### Backend (Django)
- RESTful API architecture  

- **Endpoints for:**
  - CRUD operations  
  - Bulk updates  
  - Status toggling (PATCH)  

- **Business Logic:**
  - Email reminders via management command  
  - Overdue detection  

- MongoEngine for MongoDB interaction  
- Serialization layer for JSON responses  

---


1. User interacts with Angular UI  
2. Angular Service sends HTTP request  
3. Django processes request  
4. MongoEngine interacts with MongoDB  
5. Data serialized into JSON  
6. Response returned and rendered in UI  

---

## Key Learnings
- Built scalable full-stack architecture  
- Designed and consumed REST APIs effectively  
- Implemented real-time UI feedback patterns  
- Learned MongoDB document modeling via MongoEngine  
- Improved frontend state management with RxJS  
- Handled performance optimization (pagination, lazy loading)  
- Implemented background task logic (emails, reminders)  

---

## How to Run

### Frontend
```bash
npm install
ng serve
# or
npm run dev
pip install -r requirements.txt
python manage.py runserver

