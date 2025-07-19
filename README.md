# 🏥 Healthcare System

A full-stack Healthcare Management System built with **Django** for the backend and **React (TypeScript)** for the frontend. The platform enables patients, doctors, and admin to manage appointments, medical records, and communication in a secure and efficient environment.

---

## 📌 Features

### ✅ Patient
- Register and log in
- view nearby facilities and join some consultation groups
- Access personal medical records
- Receive notifications and prescriptions

### ✅ Doctor
- Secure login
- View appointment schedule
- Access and update patient records
- Write prescriptions
- monitor system usage and logs

### ✅ Admin/Procurement Officer
- Predict Items/equipments
- Reordering points/items
- Monitor system usage and logs

---

## 🛠 Tech Stack

| Layer     | Technology             |
|-----------|------------------------|
| Backend   | Django, Django REST Framework |
| Frontend  | React, TypeScript, Tailwind CSS |
| Database  | SQLite for dev |
| Auth      | JWT / Django Auth |
| API       | RESTful API |
| Hosting   | Docker + Nginx (optional) |
| Dev Tools | Git, VS Code, Postman, etc. |

---


### 🔧 Backend Setup (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

### 🔧 Frontend Setup (React)
npm install
npm run dev  # or `npm start`

----



