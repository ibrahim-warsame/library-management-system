// api/prisma/seed.ts
// Inserts 5 genres and 16 books. Run with: npx prisma db seed
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const genreNames = ['Science Fiction', 'Fantasy', 'Mystery', 'Biography', 'Classic Literature'];

const toSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

const sampleBooks = [
  // Science Fiction
  { title: 'Dune', author: 'Frank Herbert', isbn: '9780441013593', genre: 'Science Fiction' },
  { title: 'Neuromancer', author: 'William Gibson', isbn: '9780441569595', genre: 'Science Fiction' },
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', isbn: '9780441478125', genre: 'Science Fiction' },
  // Fantasy
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '9780547928227', genre: 'Fantasy' },
  { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', isbn: '9780547773742', genre: 'Fantasy' },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', isbn: '9780756404741', genre: 'Fantasy' },
  // Mystery
  { title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', isbn: '9780140437867', genre: 'Mystery' },
  { title: 'And Then There Were None', author: 'Agatha Christie', isbn: '9780062073488', genre: 'Mystery' },
  { title: 'The Big Sleep', author: 'Raymond Chandler', isbn: '9780394758282', genre: 'Mystery' },
  // Biography
  { title: 'Educated', author: 'Tara Westover', isbn: '9780399590504', genre: 'Biography' },
  { title: 'The Diary of a Young Girl', author: 'Anne Frank', isbn: '9780553296983', genre: 'Biography' },
  { title: 'Long Walk to Freedom', author: 'Nelson Mandela', isbn: '9780316548182', genre: 'Biography' },
  // Classic Literature
  { title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '9780141439518', genre: 'Classic Literature' },
  { title: 'Great Expectations', author: 'Charles Dickens', isbn: '9780141439563', genre: 'Classic Literature' },
  { title: 'Things Fall Apart', author: 'Chinua Achebe', isbn: '9780385474542', genre: 'Classic Literature' },
  { title: 'Jane Eyre', author: 'Charlotte Brontë', isbn: '9780141441146', genre: 'Classic Literature' },
];

async function main() {
  // upsert keeps the seed safe to re-run without creating duplicates.
  const genres = await Promise.all(
    genreNames.map((name) =>
      prisma.genre.upsert({
        where: { slug: toSlug(name) },
        update: {},
        create: { name, slug: toSlug(name) },
      }),
    ),
  );

  for (const book of sampleBooks) {
    const genre = genres.find((g) => g.name === book.genre);
    if (!genre) throw new Error(`Unknown genre: ${book.genre}`);

    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {},
      create: {
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        description: `${book.title} by ${book.author}.`,
        totalCopies: 3,
        availableCopies: 3,
        genreId: genre.id,
      },
    });
  }

  const [genreCount, bookCount] = await Promise.all([prisma.genre.count(), prisma.book.count()]);
  console.log(`Seeded ${genreCount} genres and ${bookCount} books`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
