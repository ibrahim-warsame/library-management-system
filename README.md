# Library Management System

A NestJS + Prisma + PostgreSQL API for a library's book catalog.

## Setup

```bash
cd api
npm install
cp .env.example .env          # then put your hosted Postgres URL (Neon/Supabase) in DATABASE_URL
npx prisma migrate dev        # creates the tables and generates the typed client
npx prisma db seed            # inserts 5 genres, 16 books, 2 users
npm run start:dev             # runs the API with auto-reload
```

`npx prisma studio` opens a GUI to browse the data.

## Schema Decisions

**Why `Book` references `Genre` instead of embedding it.**
Each `Book` stores only a `genreId` foreign key pointing at a row in the `Genre` table, rather than carrying a copy of the genre's name and slug inside the book record. I chose this because:

- **One source of truth.** A genre's name lives in exactly one row. Renaming "Sci-Fi" to "Science Fiction" is a single `UPDATE`, and every book reflects it immediately. With an embedded copy I would have to find and rewrite it on every book, and any I missed would silently disagree.
- **Genres are shared, many books per genre.** Genre is a one-to-many relationship (one `Genre` has many `Book`s). Embedding would duplicate the same genre data across dozens of books.
- **The database enforces validity.** The foreign key means a book cannot point at a genre that does not exist, and a genre that still has books cannot be deleted by accident. Embedded strings like `"Mistery"` would be accepted without complaint.
- **Genres are useful on their own.** Genres can be listed, created and queried independently (`GET /genres`, "all books in genre 2") without scanning every book.
- **Cheap to read back together.** When a book and its genre are needed together, Prisma's `include: { genre: true }` performs the join, so referencing costs very little at read time.

Other decisions:

- **`Role` enum (`PATRON`, `LIBRARIAN`)** on `User` restricts the role to two valid values at the database level; it defaults to `PATRON`.
- **`isbn` is `@unique`** so the same book cannot be catalogued twice; `Genre.name` and `Genre.slug` are unique for the same reason.
- **`totalCopies` and `availableCopies`** are separate so borrowing can later decrement availability without losing the size of the collection.
- **`Review` (stretch)** links a `User` to a `Book` with a `rating` and optional `comment`. `@@unique([bookId, userId])` allows one review per user per book, and deleting a book or user cascades to their reviews.

### Prisma vs. a document database

The biggest difference from modeling in a document database (like MongoDB) was that the question is no longer "what does one book document look like?" but "which table owns each fact?". In a document store the natural instinct is to nest the genre inside the book for fast single reads; in Prisma/Postgres the schema pushes me to normalize and let relations (`@relation`) plus `include` do the joining, with the database guaranteeing consistency.

## Project structure

```
api/
├── prisma/
│   ├── schema.prisma     # Role enum, User, Genre, Book, Review
│   └── seed.ts           # 5 genres, 16 books, 2 users
└── src/
    ├── app.module.ts
    ├── main.ts
    └── prisma/
        ├── prisma.module.ts
        └── prisma.service.ts   # PrismaClient wrapped as an injectable provider
```
