# Rouxmise

A self-hosted recipe manager. Enter, edit, delete, search, and print recipe cards.

## Stack
- PHP 8.4 + SQLite
- Vanilla HTML/CSS/JS (fully responsive)
- Nginx

## Features
- Add, edit, delete recipes
- Full-text search across all fields
- Generate shopping lists from ingredients
- Print recipe cards for lamination

## Setup
Clone into your web root and point Nginx at the directory. The database is auto-created on first run.

## Requirements
- Nginx
- PHP 8.4+ with SQLite3 extension (enabled by default)
- No database installation required

## Status
v1.0 - fully functional.  Deployed on a Raspberry Pi 4 running Nginx + PHP 8.4 + SQLite.
