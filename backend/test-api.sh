#!/bin/bash

# Habit Tracker Backend - API Test Examples
# These are curl commands to test the API

BASE_URL="http://localhost:3000"
TOKEN=""

echo "=== SIGNUP TEST ==="
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }')

echo $SIGNUP_RESPONSE
TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"

echo -e "\n=== LOGIN TEST ==="
curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }' | jq .

echo -e "\n=== CREATE HABIT ==="
curl -s -X POST $BASE_URL/api/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Morning Exercise",
    "color": "#3b82f6",
    "frequency": "daily",
    "showInCalendar": true
  }' | jq .

echo -e "\n=== GET ALL HABITS ==="
curl -s -X GET $BASE_URL/api/habits \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== MARK HABIT COMPLETE ==="
curl -s -X POST $BASE_URL/api/completions/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "habitId": 1,
    "date": "2025-03-12"
  }' | jq .

echo -e "\n=== GET COMPLETIONS FOR DATE ==="
curl -s -X GET "$BASE_URL/api/completions/date/2025-03-12" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== HEALTH CHECK ==="
curl -s -X GET $BASE_URL/api/health | jq .
